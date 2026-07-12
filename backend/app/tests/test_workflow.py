import pytest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.connection import Base
from app.models.models import Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
from app.services import services
from fastapi import HTTPException

# In-memory SQLite for isolated, fast unit testing
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Enable foreign keys
    cursor = session.connection().connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_complete_hackathon_workflow(db):
    # Step 1: Register vehicle 'Van-05' with a maximum capacity of 500 kg. Status = Available.
    from app.schemas.schemas import VehicleCreate, DriverCreate, TripCreate, TripComplete, MaintenanceCreate
    
    v_schema = VehicleCreate(
        reg_no="Van-05",
        name="Van 5",
        type="Van",
        max_load_capacity=500.0,
        odometer=10000.0,
        acquisition_cost=500000.0
    )
    vehicle = services.create_vehicle(db, v_schema)
    assert vehicle.reg_no == "Van-05"
    assert vehicle.max_load_capacity == 500.0
    assert vehicle.status == "Available"
    
    # Step 2: Register driver 'Alex' with a valid driving license.
    d_schema = DriverCreate(
        name="Alex",
        license_no="LIC-ALEX-123",
        license_category="Light",
        license_expiry=datetime.date.today() + datetime.timedelta(days=100),
        contact_no="+91 9999999999",
        safety_score=100.0
    )
    driver = services.create_driver(db, d_schema)
    assert driver.name == "Alex"
    assert driver.status == "Available"

    # Step 3: Create a trip with Cargo Weight = 450 kg.
    t_schema = TripCreate(
        source="Source Warehouse",
        destination="Client Depot",
        vehicle_id=vehicle.id,
        driver_id=driver.id,
        cargo_weight=450.0,
        planned_distance=150.0
    )
    trip = services.create_trip(db, t_schema)
    assert trip.cargo_weight == 450.0
    assert trip.status == "Draft"
    
    # Check weight constraint validation: cargo > capacity (600 kg > 500 kg should raise 400 error)
    invalid_t_schema = TripCreate(
        source="Source Warehouse",
        destination="Client Depot",
        vehicle_id=vehicle.id,
        driver_id=driver.id,
        cargo_weight=600.0,
        planned_distance=150.0
    )
    with pytest.raises(HTTPException) as exc_info:
        services.create_trip(db, invalid_t_schema)
    assert exc_info.value.status_code == 400
    assert "exceeds vehicle max capacity" in exc_info.value.detail

    # Step 4 & 5: System allows dispatch, Vehicle and Driver status automatically become On Trip.
    services.dispatch_trip(db, trip.id)
    assert trip.status == "Dispatched"
    assert vehicle.status == "On Trip"
    assert driver.status == "On Trip"
    
    # Check driver busy validation: cannot assign a busy driver to another trip
    busy_t_schema = TripCreate(
        source="Secondary Warehouse",
        destination="Depot B",
        vehicle_id=vehicle.id,
        driver_id=driver.id,
        cargo_weight=100.0,
        planned_distance=50.0
    )
    with pytest.raises(HTTPException) as exc_info:
        services.create_trip(db, busy_t_schema)
    assert exc_info.value.status_code == 400
    assert "already assigned to an active trip" in exc_info.value.detail

    # Step 6 & 7: Complete the trip by entering the final odometer and fuel consumed.
    # System marks both Vehicle and Driver as Available.
    comp_schema = TripComplete(
        end_odometer=10150.0, # +150 km distance traveled
        fuel_consumed=15.0, # liters
        revenue=12000.0
    )
    services.complete_trip(db, trip.id, comp_schema)
    assert trip.status == "Completed"
    assert vehicle.status == "Available"
    assert driver.status == "Available"
    assert vehicle.odometer == 10150.0
    
    # Verify fuel log was created
    fuel_log = db.query(FuelLog).filter(FuelLog.vehicle_id == vehicle.id).first()
    assert fuel_log is not None
    assert fuel_log.liters == 15.0

    # Step 8: Create a maintenance record. Vehicle status automatically becomes In Shop.
    m_schema = MaintenanceCreate(
        vehicle_id=vehicle.id,
        description="Oil Change",
        date=datetime.date.today(),
        cost=1500.0
    )
    m_log = services.create_maintenance_log(db, m_schema)
    assert m_log.status == "Active"
    assert vehicle.status == "In Shop"
    
    # Rule check: Retired/In Shop vehicles hidden from dispatch.
    # Try to assign 'In Shop' vehicle to a new trip - should fail validation
    with pytest.raises(HTTPException) as exc_info:
        services.create_trip(db, TripCreate(
            source="Source", destination="Dest", vehicle_id=vehicle.id, driver_id=driver.id, cargo_weight=100, planned_distance=50
        ))
    assert exc_info.value.status_code == 400
    assert "is 'In Shop'" in exc_info.value.detail

    # Close maintenance
    services.complete_maintenance_log(db, m_log.id)
    assert m_log.status == "Completed"
    assert vehicle.status == "Available"
