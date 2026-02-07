from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Horse
from app.schemas import HorseCreate, HorseRead, HorseReadWithRecords, HorseUpdate

router = APIRouter(prefix="/horses", tags=["horses"])


@router.get("/", response_model=list[HorseRead])
async def list_horses(
    skip: int = 0,
    limit: int = 100,
    health_status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Horse)
    if health_status:
        query = query.where(Horse.health_status == health_status)
    query = query.offset(skip).limit(limit).order_by(Horse.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{horse_id}", response_model=HorseReadWithRecords)
async def get_horse(horse_id: int, db: AsyncSession = Depends(get_db)):
    query = (
        select(Horse)
        .where(Horse.id == horse_id)
        .options(selectinload(Horse.medical_records))
    )
    result = await db.execute(query)
    horse = result.scalar_one_or_none()
    if not horse:
        raise HTTPException(status_code=404, detail="Horse not found")
    return horse


@router.post("/", response_model=HorseRead, status_code=status.HTTP_201_CREATED)
async def create_horse(horse_in: HorseCreate, db: AsyncSession = Depends(get_db)):
    horse = Horse(**horse_in.model_dump())
    db.add(horse)
    await db.commit()
    await db.refresh(horse)
    return horse


@router.put("/{horse_id}", response_model=HorseRead)
async def update_horse(
    horse_id: int, horse_in: HorseUpdate, db: AsyncSession = Depends(get_db)
):
    query = select(Horse).where(Horse.id == horse_id)
    result = await db.execute(query)
    horse = result.scalar_one_or_none()
    if not horse:
        raise HTTPException(status_code=404, detail="Horse not found")
    update_data = horse_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(horse, field, value)
    await db.commit()
    await db.refresh(horse)
    return horse


@router.delete("/{horse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_horse(horse_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Horse).where(Horse.id == horse_id)
    result = await db.execute(query)
    horse = result.scalar_one_or_none()
    if not horse:
        raise HTTPException(status_code=404, detail="Horse not found")
    await db.delete(horse)
    await db.commit()
