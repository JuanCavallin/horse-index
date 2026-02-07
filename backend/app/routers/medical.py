from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Horse, MedicalRecord
from app.schemas import MedicalRecordCreate, MedicalRecordRead, MedicalRecordUpdate

router = APIRouter(prefix="/medical-records", tags=["medical_records"])


@router.get("/horse/{horse_id}", response_model=list[MedicalRecordRead])
async def list_records_for_horse(
    horse_id: int, db: AsyncSession = Depends(get_db)
):
    horse = await db.get(Horse, horse_id)
    if not horse:
        raise HTTPException(status_code=404, detail="Horse not found")
    query = (
        select(MedicalRecord)
        .where(MedicalRecord.horse_id == horse_id)
        .order_by(MedicalRecord.date.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{record_id}", response_model=MedicalRecordRead)
async def get_record(record_id: int, db: AsyncSession = Depends(get_db)):
    record = await db.get(MedicalRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return record


@router.post("/", response_model=MedicalRecordRead, status_code=status.HTTP_201_CREATED)
async def create_record(
    record_in: MedicalRecordCreate, db: AsyncSession = Depends(get_db)
):
    horse = await db.get(Horse, record_in.horse_id)
    if not horse:
        raise HTTPException(status_code=404, detail="Horse not found")
    record = MedicalRecord(**record_in.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.put("/{record_id}", response_model=MedicalRecordRead)
async def update_record(
    record_id: int,
    record_in: MedicalRecordUpdate,
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(MedicalRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    update_data = record_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    await db.commit()
    await db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(record_id: int, db: AsyncSession = Depends(get_db)):
    record = await db.get(MedicalRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    await db.delete(record)
    await db.commit()
