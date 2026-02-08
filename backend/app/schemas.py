import datetime as dt

from pydantic import BaseModel, ConfigDict

from app.models import HealthStatus, RecordType
# --- Horse Schemas ---


class HorseBase(BaseModel):
    name: str
    breed: str
    age: int
    sex: str
    color: str
    photo_url: str | None = None
    health_status: HealthStatus = HealthStatus.healthy
    arrival_date: dt.date
    notes: str | None = None


class HorseCreate(HorseBase):
    pass


class HorseUpdate(BaseModel):
    name: str | None = None
    breed: str | None = None
    age: int | None = None
    sex: str | None = None
    color: str | None = None
    photo_url: str | None = None
    health_status: HealthStatus | None = None
    arrival_date: dt.date | None = None
    notes: str | None = None


class HorseRead(HorseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: dt.datetime
    updated_at: dt.datetime


class HorseReadWithRecords(HorseRead):
    medical_records: list["MedicalRecordRead"] = []


# --- MedicalRecord Schemas ---


class MedicalRecordBase(BaseModel):
    record_type: RecordType
    description: str
    vet_name: str
    date: dt.date
    next_followup: dt.date | None = None
    notes: str | None = None


class MedicalRecordCreate(MedicalRecordBase):
    horse_id: int


class MedicalRecordUpdate(BaseModel):
    record_type: RecordType | None = None
    description: str | None = None
    vet_name: str | None = None
    date: dt.date | None = None
    next_followup: dt.date | None = None
    notes: str | None = None


class MedicalRecordRead(MedicalRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    horse_id: int
    created_at: dt.datetime
