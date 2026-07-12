import datetime
import random
from sqlalchemy.orm import Session
from app.models.models import User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Notification
from app.core.security import get_password_hash

def seed_db(db: Session):
    # Check if database is already seeded
    if db.query(User).first() is not None:
        return
        
    print("Seeding database...")
    
    # 1. Seed Users (RBAC)
    users_to_seed = [
        {"email": "manager@transitops.in", "role": "Fleet Manager", "name": "Marcus Aurelius"},
        {"email": "dispatcher@transitops.in", "role": "Dispatcher", "name": "Raven K."},
        {"email": "safety@transitops.in", "role": "Safety Officer", "name": "Sophia Patel"},
        {"email": "analyst@transitops.in", "role": "Financial Analyst", "name": "Alan Greenspan"},
    ]
    for u in users_to_seed:
        user = User(
            email=u["email"],
            password_hash=get_password_hash("password123"),
            role=u["role"],
            name=u["name"]
        )
        db.add(user)
        
    # 2. Seed 20 Vehicles
    vehicle_types = ["Van", "Truck", "Mini", "Sedan"]
    vehicle_names = {
        "Van": ["Van-01", "Van-02", "Van-03", "Van-04", "Van-05", "Ford Transit", "Mercedes Sprinter"],
        "Truck": ["Truck-01", "Truck-02", "Volvo FH16", "Scania V8", "Peterbilt 389", "Kenworth T680"],
        "Mini": ["Mini-01", "Mini-02", "Mini-03", "Nissan NV200", "Piaggio Porter"],
        "Sedan": ["Toyota Prius", "Honda Civic", "Tesla Model 3"]
    }
    
    vehicles = []
    # Seed Van-05 explicitly for the workflow validation step
    van05 = Vehicle(
        reg_no="GJ01AB4521",
        name="VAN-05",
        type="Van",
        max_load_capacity=500.0, # 500 kg
        odometer=74000.0,
        acquisition_cost=620000.0,
        status="Available"
    )
    db.add(van05)
    vehicles.append(van05)
    
    for i in range(19):
        v_type = random.choice(vehicle_types)
        name = random.choice(vehicle_names[v_type])
        if i == 0:
            reg = "GJ01AB9981"
            name = "TRUCK-11"
            v_type = "Truck"
            capacity = 5000.0
            odometer = 182000.0
            cost = 2450000.0
            status = "On Trip"
        elif i == 1:
            reg = "GJ01AB1120"
            name = "MINI-03"
            v_type = "Mini"
            capacity = 1000.0
            odometer = 66000.0
            cost = 410000.0
            status = "In Shop"
        elif i == 2:
            reg = "GJ01AB0008"
            name = "VAN-09"
            v_type = "Van"
            capacity = 750.0
            odometer = 241900.0
            cost = 590000.0
            status = "Retired"
        else:
            reg = f"GJ01AB{random.randint(1000, 9999)}"
            # Avoid duplicate reg numbers
            while any(v.reg_no == reg for v in vehicles):
                reg = f"GJ01AB{random.randint(1000, 9999)}"
            
            capacity = random.choice([500.0, 750.0, 1000.0, 2000.0, 5000.0, 8000.0])
            odometer = random.randint(10000, 250000)
            cost = random.randint(300000, 3000000)
            status = random.choice(["Available", "Available", "Available", "On Trip", "Available"])
            
        veh = Vehicle(
            reg_no=reg,
            name=name,
            type=v_type,
            max_load_capacity=capacity,
            odometer=odometer,
            acquisition_cost=cost,
            status=status
        )
        db.add(veh)
        vehicles.append(veh)
        
    db.commit()
    
    # 3. Seed 20 Drivers
    driver_names = [
        "Alex", "John", "Priya", "Robert", "Emily", "David", "Jessica", "Michael", 
        "Sarah", "William", "Ashley", "James", "Amanda", "Joseph", "Melissa", 
        "Charles", "Stephanie", "Christopher", "Nicole", "Daniel"
    ]
    
    drivers = []
    # Seed Alex explicitly for the workflow validation step
    alex = Driver(
        name="Alex",
        license_no="DL-2026-ALEX01",
        license_category="Light",
        license_expiry=datetime.date.today() + datetime.timedelta(days=365), # valid
        contact_no="+91 9876543210",
        safety_score=94.5,
        status="Available"
    )
    db.add(alex)
    drivers.append(alex)
    
    for i, name in enumerate(driver_names[1:]):
        license_no = f"DL-2026-{name.upper()[:4]}{random.randint(100, 999)}"
        category = random.choice(["Light", "Heavy", "Medium"])
        
        # Make one driver have an expired license for testing
        if i == 5:
            expiry = datetime.date.today() - datetime.timedelta(days=10) # expired
        else:
            expiry = datetime.date.today() + datetime.timedelta(days=random.randint(-15, 730))
            
        contact = f"+91 99{random.randint(10000000, 99999999)}"
        safety_score = round(random.uniform(70.0, 100.0), 1)
        
        # Sync with vehicle statuses to make it look realistic
        if i == 0: # John
            status = "On Trip"
        elif i == 1: # Priya
            status = "Available"
        elif i == 3: # Suspended driver
            status = "Suspended"
        else:
            status = random.choice(["Available", "Available", "Available", "Off Duty"])
            
        driver = Driver(
            name=name,
            license_no=license_no,
            license_category=category,
            license_expiry=expiry,
            contact_no=contact,
            safety_score=safety_score,
            status=status
        )
        db.add(driver)
        drivers.append(driver)
        
    db.commit()
    
    # 4. Seed 50 Trips
    sources = ["Mumbai Warehouse", "Delhi Hub", "Bangalore Depot", "Kolkata Port", "Chennai Plant", "Ahmedabad Terminal"]
    destinations = ["Pune DC", "Gurugram Hub", "Hyderabad Warehouse", "Patna Store", "Kochi DC", "Surat Outlet"]
    
    trips_created = []
    # Seed 10 Completed/Cancelled trips, and some active trips
    for i in range(50):
        # Pick random vehicle and driver
        v = random.choice(vehicles)
        d = random.choice(drivers)
        
        cargo = round(v.max_load_capacity * random.uniform(0.3, 0.95), 1)
        distance = round(random.uniform(50.0, 450.0), 1)
        
        # Create some draft, completed, cancelled, dispatched trips
        if i < 35:
            status = "Completed"
            revenue = round(distance * random.uniform(15.0, 30.0), 2)
            fuel = round((distance / random.uniform(8.0, 15.0)), 1)
            end_odo = v.odometer - (50 - i) * 100.0 # historical
            trip_date = datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 60))
        elif i < 40:
            status = "Cancelled"
            revenue = 0.0
            fuel = None
            end_odo = None
            trip_date = datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 30))
        elif i < 45:
            status = "Dispatched"
            # Ensure the vehicle & driver status are On Trip
            v.status = "On Trip"
            d.status = "On Trip"
            revenue = 0.0
            fuel = None
            end_odo = None
            trip_date = datetime.datetime.utcnow()
        else:
            status = "Draft"
            revenue = 0.0
            fuel = None
            end_odo = None
            trip_date = datetime.datetime.utcnow()
            
        trip = Trip(
            source=random.choice(sources),
            destination=random.choice(destinations),
            vehicle_id=v.id,
            driver_id=d.id,
            cargo_weight=cargo,
            planned_distance=distance,
            status=status,
            revenue=revenue,
            end_odometer=end_odo,
            fuel_consumed=fuel,
            created_at=trip_date,
            updated_at=trip_date
        )
        db.add(trip)
        trips_created.append(trip)
        
    db.commit()
    
    # 5. Seed 100 Fuel Logs
    for i in range(100):
        v = random.choice(vehicles)
        liters = round(random.uniform(10.0, 80.0), 1)
        cost = round(liters * random.uniform(85.0, 105.0), 2) # Local Fuel pricing
        log_date = datetime.date.today() - datetime.timedelta(days=random.randint(1, 90))
        
        fuel_log = FuelLog(
            vehicle_id=v.id,
            liters=liters,
            cost=cost,
            date=log_date
        )
        db.add(fuel_log)
        
        # Fuel counts as a vehicle expense
        exp = Expense(
            vehicle_id=v.id,
            type="Fuel",
            cost=cost,
            date=log_date
        )
        db.add(exp)
        
    db.commit()
    
    # 6. Seed 20 Maintenance Logs
    descriptions = ["Oil Change & Engine Tune", "Brake Pad Replacement", "Tire Rotation & Alignment", "AC Service", "Battery Replacement", "Transmission Checkup"]
    for i in range(20):
        v = random.choice(vehicles)
        m_cost = round(random.choice([1200.0, 4500.0, 8000.0, 350.0, 15000.0]), 2)
        m_date = datetime.date.today() - datetime.timedelta(days=random.randint(1, 90))
        
        # Status
        m_status = "Completed" if i > 2 else "Active"
        if m_status == "Active":
            v.status = "In Shop"
            
        m_log = MaintenanceLog(
            vehicle_id=v.id,
            description=random.choice(descriptions),
            date=m_date,
            cost=m_cost,
            status=m_status
        )
        db.add(m_log)
        
        # Maintenance cost counts as expense
        exp = Expense(
            vehicle_id=v.id,
            type="Maintenance",
            cost=m_cost,
            date=m_date
        )
        db.add(exp)
        
    # Seed 15 General Expenses (Tolls, Permits, Insurance)
    expense_types = ["Toll", "Insurance", "Permit", "Fine"]
    for i in range(15):
        v = random.choice(vehicles)
        e_cost = round(random.uniform(100.0, 2500.0), 2)
        e_date = datetime.date.today() - datetime.timedelta(days=random.randint(1, 90))
        
        exp = Expense(
            vehicle_id=v.id,
            type=random.choice(expense_types),
            cost=e_cost,
            date=e_date
        )
        db.add(exp)
        
    # 7. Seed Notifications
    notifications = [
        "License Warning: Driver 'Emily' license expires in 5 days.",
        "System: Vehicle 'GJ01AB1120' checked in for Service.",
        "Trip Update: Trip TR-432 completed by Alex.",
        "Alert: Fuel efficiency drop detected on Vehicle 'Volvo FH16'."
    ]
    for n in notifications:
        note = Notification(
            message=n,
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(1, 24)),
            read=False
        )
        db.add(note)
        
    db.commit()
    print("Database seeding completed!")
