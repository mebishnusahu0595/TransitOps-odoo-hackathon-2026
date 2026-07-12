from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import date, datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserLogin(BaseModel):
    email: str
    password: str
    role: str

class UserCreate(BaseModel):
    email: str
    password: str
    role: str
    name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    name: Optional[str]

    class Config:
        from_attributes = True

# Vehicle Schemas
class VehicleCreate(BaseModel):
    reg_no: str = Field(..., description="Unique Registration Number")
    name: str
    type: str  # 'Van', 'Truck', 'Mini', 'Sedan'
    max_load_capacity: float = Field(..., gt=0, description="Max Load Capacity in kg")
    odometer: float = Field(default=0.0, ge=0)
    acquisition_cost: float = Field(..., gt=0)

class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    max_load_capacity: Optional[float] = None
    odometer: Optional[float] = None
    status: Optional[str] = None # 'Available', 'On Trip', 'In Shop', 'Retired'

class VehicleOut(BaseModel):
    id: int
    reg_no: str
    name: str
    type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    status: str

    class Config:
        from_attributes = True

# Driver Schemas
class DriverCreate(BaseModel):
    name: str
    license_no: str
    license_category: str
    license_expiry: date
    contact_no: str
    safety_score: float = Field(default=100.0, ge=0, le=100)

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[date] = None
    contact_no: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[str] = None # 'Available', 'On Trip', 'Off Duty', 'Suspended'

class DriverOut(BaseModel):
    id: int
    name: str
    license_no: str
    license_category: str
    license_expiry: date
    contact_no: str
    safety_score: float
    status: str

    class Config:
        from_attributes = True

# Trip Schemas
class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float = Field(..., gt=0)
    planned_distance: float = Field(..., gt=0)

class TripComplete(BaseModel):
    end_odometer: float = Field(..., gt=0)
    fuel_consumed: float = Field(..., gt=0)
    revenue: float = Field(default=0.0, ge=0)

class TripOut(BaseModel):
    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float
    status: str
    end_odometer: Optional[float] = None
    fuel_consumed: Optional[float] = None
    revenue: float
    created_at: datetime
    updated_at: datetime
    vehicle: Optional[VehicleOut] = None
    driver: Optional[DriverOut] = None

    class Config:
        from_attributes = True

# Maintenance Schemas
class MaintenanceCreate(BaseModel):
    vehicle_id: int
    description: str
    date: date
    cost: float = Field(..., gt=0)

class MaintenanceOut(BaseModel):
    id: int
    vehicle_id: int
    description: str
    date: date
    cost: float
    status: str
    vehicle: Optional[VehicleOut] = None

    class Config:
        from_attributes = True

# Fuel schemas
class FuelLogCreate(BaseModel):
    vehicle_id: int
    liters: float = Field(..., gt=0)
    cost: float = Field(..., gt=0)
    date: date

class FuelLogOut(BaseModel):
    id: int
    vehicle_id: int
    liters: float
    cost: float
    date: date
    vehicle: Optional[VehicleOut] = None

    class Config:
        from_attributes = True

# Expense schemas
class ExpenseCreate(BaseModel):
    vehicle_id: int
    type: str
    cost: float = Field(..., gt=0)
    date: date

class ExpenseOut(BaseModel):
    id: int
    vehicle_id: int
    type: str
    cost: float
    date: date
    vehicle: Optional[VehicleOut] = None

    class Config:
        from_attributes = True

# Notification & Audit Logs
class NotificationOut(BaseModel):
    id: int
    message: str
    timestamp: datetime
    read: bool

    class Config:
        from_attributes = True

class ActivityLogOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    timestamp: datetime
    details: Optional[str]

    class Config:
        from_attributes = True

# Dashboard/Analytics stats
class KPICard(BaseModel):
    value: float
    change: Optional[float] = None

class DashboardStats(BaseModel):
    active_vehicles: int
    available_vehicles: int
    vehicles_in_maintenance: int
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization: float
    total_fuel_cost: float
    total_maintenance_cost: float
    total_expense_cost: float
    total_revenue: float
    roi: float
