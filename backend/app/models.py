import enum
from datetime import date, datetime

from sqlalchemy import Integer, String, Text, Date, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HealthStatus(str, enum.Enum):
    healthy = "healthy"
    needs_attention = "needs_attention"
    critical = "critical"
    palliative = "palliative"


class RecordType(str, enum.Enum):
    checkup = "checkup"
    vaccination = "vaccination"
    treatment = "treatment"
    surgery = "surgery"
    other = "other"


class Horse(Base):
    __tablename__ = "horses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    breed: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    sex: Mapped[str] = mapped_column(String(20), nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    health_status: Mapped[HealthStatus] = mapped_column(
        Enum(HealthStatus), default=HealthStatus.healthy, nullable=False
    )
    arrival_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    medical_records: Mapped[list["MedicalRecord"]] = relationship(
        back_populates="horse", cascade="all, delete-orphan"
    )


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    horse_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("horses.id", ondelete="CASCADE"), nullable=False
    )
    record_type: Mapped[RecordType] = mapped_column(Enum(RecordType), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    vet_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    next_followup: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    horse: Mapped["Horse"] = relationship(back_populates="medical_records")
