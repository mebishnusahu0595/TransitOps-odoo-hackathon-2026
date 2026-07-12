import datetime
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
import jwt

from app.database.connection import engine, Base, get_db
from app.models import models
from app.schemas import schemas
from app.services import services
from app.seed.seed_data import seed_db
from app.core import security
from app.core.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto seed database on startup
db_gen = next(get_db())
try:
    seed_db(db_gen)
finally:
    db_gen.close()

app = FastAPI(title="TransitOps ERP Backend", version="1.0.0")

# Enable CORS for frontend Vite server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        # Fallback for dev mode/testing without tokens or for simple UI mock testing
        # Returns a default Dispatcher user
        default_user = db.query(models.User).filter(models.User.email == "dispatcher@transitops.in").first()
        if default_user:
            return default_user
        raise HTTPException(status_code=401, detail="Authentication token required")
        
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    if user.is_locked:
        raise HTTPException(
            status_code=400, 
            detail="Invalid credentials. Account locked after 5 failed attempts."
        )
        
    if not security.verify_password(form_data.password, user.password_hash):
        user.failed_attempts += 1
        if user.failed_attempts >= 5:
            user.is_locked = True
            db.commit()
            raise HTTPException(
                status_code=400, 
                detail="Invalid credentials. Account locked after 5 failed attempts."
            )
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    # Enforce role matching for login testing
    if user.role != form_data.role:
         raise HTTPException(status_code=400, detail=f"Incorrect role selection. User is a {user.role}.")
         
    # Reset attempts on successful login
    user.failed_attempts = 0
    db.commit()
    
    access_token = security.create_access_token(subject=user.email, role=user.role)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- Dashboard Endpoints ---
@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Run warnings checks
    services.check_license_expiry_warnings(db)

    # Base vehicle query
    veh_query = db.query(models.Vehicle)
    if type and type != "All":
        veh_query = veh_query.filter(models.Vehicle.type == type)
    if status and status != "All":
        veh_query = veh_query.filter(models.Vehicle.status == status)

    active_vehicles = veh_query.filter(models.Vehicle.status == "On Trip").count()
    available_vehicles = veh_query.filter(models.Vehicle.status == "Available").count()
    vehicles_in_maintenance = veh_query.filter(models.Vehicle.status == "In Shop").count()
    
    # Filtered vehicles list to filter related trips/fuel
    filtered_veh_ids = [v.id for v in veh_query.all()]

    active_trips = db.query(models.Trip).filter(models.Trip.status == "Dispatched")
    pending_trips = db.query(models.Trip).filter(models.Trip.status == "Draft")
    
    if type and type != "All":
        active_trips = active_trips.join(models.Vehicle).filter(models.Vehicle.type == type)
        pending_trips = pending_trips.join(models.Vehicle).filter(models.Vehicle.type == type)
        
    active_trips_count = active_trips.count()
    pending_trips_count = pending_trips.count()
    
    drivers_on_duty = db.query(models.Driver).filter(models.Driver.status.in_(["Available", "On Trip"])).count()
    
    total_active_avail = active_vehicles + available_vehicles
    utilization = (active_vehicles / total_active_avail * 100.0) if total_active_avail > 0 else 0.0
    
    # Financial metrics filtered by vehicles
    fuel_query = db.query(models.FuelLog.cost)
    maint_query = db.query(models.MaintenanceLog.cost)
    other_query = db.query(models.Expense.cost).filter(models.Expense.type.notin_(["Fuel", "Maintenance"]))
    rev_query = db.query(models.Trip.revenue).filter(models.Trip.status == "Completed")
    
    if filtered_veh_ids:
        fuel_query = fuel_query.filter(models.FuelLog.vehicle_id.in_(filtered_veh_ids))
        maint_query = maint_query.filter(models.MaintenanceLog.vehicle_id.in_(filtered_veh_ids))
        other_query = other_query.filter(models.Expense.vehicle_id.in_(filtered_veh_ids))
        rev_query = rev_query.filter(models.Trip.vehicle_id.in_(filtered_veh_ids))
    else:
        return schemas.DashboardStats(
            active_vehicles=0,
            available_vehicles=0,
            vehicles_in_maintenance=0,
            active_trips=0,
            pending_trips=0,
            drivers_on_duty=0,
            fleet_utilization=0,
            total_fuel_cost=0,
            total_maintenance_cost=0,
            total_expense_cost=0,
            total_revenue=0,
            roi=0
        )
        
    total_fuel = sum(item[0] for item in fuel_query.all())
    total_maintenance = sum(item[0] for item in maint_query.all())
    total_other = sum(item[0] for item in other_query.all())
    total_rev = sum(item[0] for item in rev_query.all())
    
    total_acq = sum(v.acquisition_cost for v in veh_query.all())
    
    roi = ((total_rev - (total_maintenance + total_fuel)) / total_acq * 100.0) if total_acq > 0 else 0.0
    
    return schemas.DashboardStats(
        active_vehicles=active_vehicles,
        available_vehicles=available_vehicles,
        vehicles_in_maintenance=vehicles_in_maintenance,
        active_trips=active_trips_count,
        pending_trips=pending_trips_count,
        drivers_on_duty=drivers_on_duty,
        fleet_utilization=round(utilization, 1),
        total_fuel_cost=round(total_fuel, 2),
        total_maintenance_cost=round(total_maintenance, 2),
        total_expense_cost=round(total_maintenance + total_fuel + total_other, 2),
        total_revenue=round(total_rev, 2),
        roi=round(roi, 1)
    )

# --- Vehicle Endpoints ---
@app.get("/vehicles", response_model=List[schemas.VehicleOut])
def list_vehicles(
    type: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Vehicle)
    if type and type != "All":
        query = query.filter(models.Vehicle.type == type)
    if status and status != "All":
        query = query.filter(models.Vehicle.status == status)
    if q:
        query = query.filter(
            (models.Vehicle.name.ilike(f"%{q}%")) | 
            (models.Vehicle.reg_no.ilike(f"%{q}%"))
        )
    return query.order_by(models.Vehicle.id.desc()).all()

@app.post("/vehicles", response_model=schemas.VehicleOut)
def register_vehicle(schema: schemas.VehicleCreate, db: Session = Depends(get_db)):
    return services.create_vehicle(db, schema)

@app.get("/vehicles/{vehicle_id}", response_model=schemas.VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@app.put("/vehicles/{vehicle_id}", response_model=schemas.VehicleOut)
def update_vehicle_details(vehicle_id: int, schema: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    return services.update_vehicle(db, vehicle_id, schema)

# --- Driver Endpoints ---
@app.get("/drivers", response_model=List[schemas.DriverOut])
def list_drivers(
    status: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Driver)
    if status and status != "All":
        query = query.filter(models.Driver.status == status)
    if q:
        query = query.filter(
            (models.Driver.name.ilike(f"%{q}%")) | 
            (models.Driver.license_no.ilike(f"%{q}%"))
        )
    return query.order_by(models.Driver.id.desc()).all()

@app.post("/drivers", response_model=schemas.DriverOut)
def register_driver(schema: schemas.DriverCreate, db: Session = Depends(get_db)):
    return services.create_driver(db, schema)

@app.get("/drivers/{driver_id}", response_model=schemas.DriverOut)
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@app.put("/drivers/{driver_id}", response_model=schemas.DriverOut)
def update_driver_details(driver_id: int, schema: schemas.DriverUpdate, db: Session = Depends(get_db)):
    return services.update_driver(db, driver_id, schema)

# --- Trip Endpoints ---
@app.get("/trips", response_model=List[schemas.TripOut])
def list_trips(
    status: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Trip)
    if status and status != "All":
        query = query.filter(models.Trip.status == status)
    if q:
        # Search by source, destination or driver name
        query = query.join(models.Driver).filter(
            (models.Trip.source.ilike(f"%{q}%")) |
            (models.Trip.destination.ilike(f"%{q}%")) |
            (models.Driver.name.ilike(f"%{q}%"))
        )
    return query.order_by(models.Trip.id.desc()).all()

@app.post("/trips", response_model=schemas.TripOut)
def create_new_trip(schema: schemas.TripCreate, db: Session = Depends(get_db)):
    return services.create_trip(db, schema)

@app.post("/trips/{trip_id}/dispatch", response_model=schemas.TripOut)
def dispatch_active_trip(trip_id: int, db: Session = Depends(get_db)):
    return services.dispatch_trip(db, trip_id)

@app.post("/trips/{trip_id}/complete", response_model=schemas.TripOut)
def complete_active_trip(trip_id: int, schema: schemas.TripComplete, db: Session = Depends(get_db)):
    return services.complete_trip(db, trip_id, schema)

@app.post("/trips/{trip_id}/cancel", response_model=schemas.TripOut)
def cancel_active_trip(trip_id: int, db: Session = Depends(get_db)):
    return services.cancel_trip(db, trip_id)

# --- Maintenance Endpoints ---
@app.get("/maintenance", response_model=List[schemas.MaintenanceOut])
def list_maintenance(db: Session = Depends(get_db)):
    return db.query(models.MaintenanceLog).order_by(models.MaintenanceLog.id.desc()).all()

@app.post("/maintenance", response_model=schemas.MaintenanceOut)
def create_maintenance(schema: schemas.MaintenanceCreate, db: Session = Depends(get_db)):
    return services.create_maintenance_log(db, schema)

@app.post("/maintenance/{log_id}/complete", response_model=schemas.MaintenanceOut)
def complete_maintenance(log_id: int, db: Session = Depends(get_db)):
    return services.complete_maintenance_log(db, log_id)

# --- Fuel & Expense Endpoints ---
@app.get("/expenses/fuel", response_model=List[schemas.FuelLogOut])
def list_fuel_logs(db: Session = Depends(get_db)):
    return db.query(models.FuelLog).order_by(models.FuelLog.id.desc()).all()

@app.post("/expenses/fuel", response_model=schemas.FuelLogOut)
def create_fuel(schema: schemas.FuelLogCreate, db: Session = Depends(get_db)):
    return services.create_fuel_log(db, schema)

@app.get("/expenses", response_model=List[schemas.ExpenseOut])
def list_expenses(db: Session = Depends(get_db)):
    return db.query(models.Expense).order_by(models.Expense.id.desc()).all()

@app.post("/expenses", response_model=schemas.ExpenseOut)
def create_general_expense(schema: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    return services.create_expense(db, schema)

# --- Notifications ---
@app.get("/notifications", response_model=List[schemas.NotificationOut])
def list_notifications(db: Session = Depends(get_db)):
    return db.query(models.Notification).order_by(models.Notification.id.desc()).limit(15).all()

@app.post("/notifications/{note_id}/read")
def mark_read(note_id: int, db: Session = Depends(get_db)):
    note = db.query(models.Notification).filter(models.Notification.id == note_id).first()
    if note:
        note.read = True
        db.commit()
    return {"status": "success"}

# --- Activity/Audit Logs ---
@app.get("/activity-logs", response_model=List[schemas.ActivityLogOut])
def list_activity_logs(db: Session = Depends(get_db)):
    return db.query(models.ActivityLog).order_by(models.ActivityLog.id.desc()).limit(30).all()
