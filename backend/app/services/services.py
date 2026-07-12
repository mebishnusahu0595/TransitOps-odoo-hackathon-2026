from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import datetime
from app.models.models import (
    Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Notification, ActivityLog, User
)
from app.schemas.schemas import (
    VehicleCreate, VehicleUpdate, DriverCreate, DriverUpdate, TripCreate, TripComplete,
    MaintenanceCreate, FuelLogCreate, ExpenseCreate
)

def log_activity(db: Session, entity_type: str, entity_id: int, action: str, details: str = None):
    log = ActivityLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        details=details,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(log)
    db.commit()

def check_license_expiry_warnings(db: Session):
    # Auto alert for licenses expiring in next 30 days
    today = datetime.date.today()
    limit = today + datetime.timedelta(days=30)
    drivers = db.query(Driver).filter(
        Driver.license_expiry <= limit,
        Driver.license_expiry >= today,
        Driver.status != "Suspended"
    ).all()
    
    for driver in drivers:
        msg = f"License Warning: Driver '{driver.name}' license ({driver.license_no}) expires on {driver.license_expiry}."
        # Avoid duplicate notifications
        exists = db.query(Notification).filter(Notification.message == msg).first()
        if not exists:
            alert = Notification(message=msg, timestamp=datetime.datetime.utcnow(), read=False)
            db.add(alert)
    db.commit()

# --- Vehicle Operations ---
def create_vehicle(db: Session, schema: VehicleCreate) -> Vehicle:
    # Rule: Vehicle registration must be unique
    existing = db.query(Vehicle).filter(Vehicle.reg_no == schema.reg_no).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with Registration Number '{schema.reg_no}' already exists."
        )
    
    vehicle = Vehicle(
        reg_no=schema.reg_no,
        name=schema.name,
        type=schema.type,
        max_load_capacity=schema.max_load_capacity,
        odometer=schema.odometer,
        acquisition_cost=schema.acquisition_cost,
        status="Available"
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    
    log_activity(db, "Vehicle", vehicle.id, "Created", f"Registered vehicle {vehicle.reg_no}")
    return vehicle

def update_vehicle(db: Session, vehicle_id: int, schema: VehicleUpdate) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        
    for var, val in vars(schema).items():
        if val is not None:
            setattr(vehicle, var, val)
            
    db.commit()
    db.refresh(vehicle)
    log_activity(db, "Vehicle", vehicle.id, "Updated", f"Updated details for vehicle {vehicle.reg_no}")
    return vehicle

# --- Driver Operations ---
def create_driver(db: Session, schema: DriverCreate) -> Driver:
    driver = Driver(
        name=schema.name,
        license_no=schema.license_no,
        license_category=schema.license_category,
        license_expiry=schema.license_expiry,
        contact_no=schema.contact_no,
        safety_score=schema.safety_score,
        status="Available"
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    
    log_activity(db, "Driver", driver.id, "Created", f"Registered driver {driver.name}")
    check_license_expiry_warnings(db)
    return driver

def update_driver(db: Session, driver_id: int, schema: DriverUpdate) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        
    for var, val in vars(schema).items():
        if val is not None:
            setattr(driver, var, val)
            
    db.commit()
    db.refresh(driver)
    log_activity(db, "Driver", driver.id, "Updated", f"Updated profile for driver {driver.name}")
    check_license_expiry_warnings(db)
    return driver

# --- Trip Operations ---
def create_trip(db: Session, schema: TripCreate) -> Trip:
    vehicle = db.query(Vehicle).filter(Vehicle.id == schema.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == schema.driver_id).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    # Rule: Retired or In Shop vehicles must never appear in the dispatch selection
    if vehicle.status in ["Retired", "In Shop"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot assign vehicle {vehicle.reg_no} because status is '{vehicle.status}'."
        )
        
    # Rule: Drivers with expired licenses or Suspended status cannot be assigned to trips
    if driver.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot assign driver {driver.name} because they are Suspended."
        )
    if driver.license_expiry < datetime.date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot assign driver {driver.name} because their driving license is expired."
        )
        
    # Rule: A driver or vehicle already marked On Trip cannot be assigned to another trip
    if vehicle.status == "On Trip":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle {vehicle.reg_no} is already assigned to an active trip."
        )
    if driver.status == "On Trip":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver {driver.name} is already assigned to an active trip."
        )
        
    # Rule: Cargo Weight must not exceed the vehicle's maximum load capacity
    if schema.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cargo weight ({schema.cargo_weight} kg) exceeds vehicle max capacity ({vehicle.max_load_capacity} kg)."
        )
        
    trip = Trip(
        source=schema.source,
        destination=schema.destination,
        vehicle_id=schema.vehicle_id,
        driver_id=schema.driver_id,
        cargo_weight=schema.cargo_weight,
        planned_distance=schema.planned_distance,
        status="Draft"
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    
    log_activity(db, "Trip", trip.id, "Created", f"Draft trip created from {trip.source} to {trip.destination}")
    return trip

def dispatch_trip(db: Session, trip_id: int) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status != "Draft":
        raise HTTPException(status_code=400, detail="Only Draft trips can be dispatched")
        
    vehicle = trip.vehicle
    driver = trip.driver
    
    # Re-validate statuses before dispatching
    if vehicle.status != "Available":
        raise HTTPException(status_code=400, detail=f"Vehicle status is '{vehicle.status}', must be 'Available'")
    if driver.status != "Available":
        raise HTTPException(status_code=400, detail=f"Driver status is '{driver.status}', must be 'Available'")
    if driver.license_expiry < datetime.date.today():
        raise HTTPException(status_code=400, detail="Driver license has expired")
        
    # Rule: Dispatching a trip automatically changes both the vehicle and driver status to On Trip.
    trip.status = "Dispatched"
    vehicle.status = "On Trip"
    driver.status = "On Trip"
    
    db.commit()
    db.refresh(trip)
    
    log_activity(db, "Trip", trip.id, "Dispatched", f"Trip dispatched to {trip.destination}")
    log_activity(db, "Vehicle", vehicle.id, "Status Changed", "Status set to On Trip due to dispatch")
    log_activity(db, "Driver", driver.id, "Status Changed", "Status set to On Trip due to dispatch")
    return trip

def complete_trip(db: Session, trip_id: int, schema: TripComplete) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status != "Dispatched":
        raise HTTPException(status_code=400, detail="Only Dispatched trips can be completed")
        
    vehicle = trip.vehicle
    driver = trip.driver
    
    # Odometer validation
    if schema.end_odometer < vehicle.odometer:
        raise HTTPException(
            status_code=400,
            detail=f"End odometer ({schema.end_odometer} km) cannot be less than start odometer ({vehicle.odometer} km)."
        )
        
    # Save post-trip details
    trip.status = "Completed"
    trip.end_odometer = schema.end_odometer
    trip.fuel_consumed = schema.fuel_consumed
    trip.revenue = schema.revenue
    
    # Update vehicle odometer
    distance_traveled = schema.end_odometer - vehicle.odometer
    vehicle.odometer = schema.end_odometer
    
    # Rule: Completing a trip automatically changes both the vehicle and driver status back to Available
    vehicle.status = "Available"
    driver.status = "Available"
    
    # Log fuel if consumed
    if schema.fuel_consumed > 0:
        # Approximate fuel cost based on average local rates (e.g. 1.2 per liter) if cost not provided, 
        # or we log a standard fuel entry. Let's record a fuel log automatically.
        fuel_cost = schema.fuel_consumed * 1.15 
        fuel_log = FuelLog(
            vehicle_id=vehicle.id,
            liters=schema.fuel_consumed,
            cost=fuel_cost,
            date=datetime.date.today()
        )
        db.add(fuel_log)
        
    db.commit()
    db.refresh(trip)
    
    log_activity(db, "Trip", trip.id, "Completed", f"Completed trip. Distance: {distance_traveled} km. Fuel: {schema.fuel_consumed} L")
    log_activity(db, "Vehicle", vehicle.id, "Odometer Updated", f"Odometer advanced to {vehicle.odometer} km")
    log_activity(db, "Vehicle", vehicle.id, "Status Changed", "Status restored to Available")
    log_activity(db, "Driver", driver.id, "Status Changed", "Status restored to Available")
    return trip

def cancel_trip(db: Session, trip_id: int) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    if trip.status not in ["Draft", "Dispatched"]:
        raise HTTPException(status_code=400, detail="Only Draft or Dispatched trips can be cancelled")
        
    vehicle = trip.vehicle
    driver = trip.driver
    
    # Rule: Cancelling a dispatched trip restores the vehicle and driver to Available.
    if trip.status == "Dispatched":
        vehicle.status = "Available"
        driver.status = "Available"
        log_activity(db, "Vehicle", vehicle.id, "Status Changed", "Status restored to Available due to cancellation")
        log_activity(db, "Driver", driver.id, "Status Changed", "Status restored to Available due to cancellation")
        
    trip.status = "Cancelled"
    db.commit()
    db.refresh(trip)
    
    log_activity(db, "Trip", trip.id, "Cancelled", "Trip cancelled")
    return trip

# --- Maintenance Operations ---
def create_maintenance_log(db: Session, schema: MaintenanceCreate) -> MaintenanceLog:
    vehicle = db.query(Vehicle).filter(Vehicle.id == schema.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    if vehicle.status == "On Trip":
        raise HTTPException(status_code=400, detail="Cannot put vehicle in maintenance while it is On Trip")
        
    # Rule: Creating an active maintenance record automatically changes vehicle status to In Shop.
    vehicle.status = "In Shop"
    
    log = MaintenanceLog(
        vehicle_id=schema.vehicle_id,
        description=schema.description,
        date=schema.date,
        cost=schema.cost,
        status="Active"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    # Record as a generic expense too
    expense = Expense(
        vehicle_id=schema.vehicle_id,
        type="Maintenance",
        cost=schema.cost,
        date=schema.date
    )
    db.add(expense)
    db.commit()
    
    log_activity(db, "MaintenanceLog", log.id, "Created", f"Active Maintenance started: {log.description}")
    log_activity(db, "Vehicle", vehicle.id, "Status Changed", "Status set to In Shop")
    return log

def complete_maintenance_log(db: Session, log_id: int) -> MaintenanceLog:
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
        
    if log.status != "Active":
        raise HTTPException(status_code=400, detail="Maintenance log is already completed")
        
    log.status = "Completed"
    vehicle = log.vehicle
    
    # Rule: Closing maintenance restores the vehicle to Available (unless retired).
    if vehicle.status != "Retired":
        vehicle.status = "Available"
        log_activity(db, "Vehicle", vehicle.id, "Status Changed", "Status restored to Available after shop checkout")
        
    db.commit()
    db.refresh(log)
    log_activity(db, "MaintenanceLog", log.id, "Completed", f"Maintenance finished: {log.description}")
    return log

# --- Fuel & Expenses ---
def create_fuel_log(db: Session, schema: FuelLogCreate) -> FuelLog:
    vehicle = db.query(Vehicle).filter(Vehicle.id == schema.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    log = FuelLog(
        vehicle_id=schema.vehicle_id,
        liters=schema.liters,
        cost=schema.cost,
        date=schema.date
    )
    db.add(log)
    
    # Record as generic expense
    expense = Expense(
        vehicle_id=schema.vehicle_id,
        type="Fuel",
        cost=schema.cost,
        date=schema.date
    )
    db.add(expense)
    db.commit()
    db.refresh(log)
    
    log_activity(db, "FuelLog", log.id, "Created", f"Logged {schema.liters} L fuel for {vehicle.reg_no}")
    return log

def create_expense(db: Session, schema: ExpenseCreate) -> Expense:
    vehicle = db.query(Vehicle).filter(Vehicle.id == schema.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    expense = Expense(
        vehicle_id=schema.vehicle_id,
        type=schema.type,
        cost=schema.cost,
        date=schema.date
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    
    log_activity(db, "Expense", expense.id, "Created", f"Logged {schema.type} expense for {vehicle.reg_no}")
    return expense
