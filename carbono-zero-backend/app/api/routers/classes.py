# app/api/routers/classes.py
from fastapi import APIRouter, HTTPException
from typing import List
from beanie import PydanticObjectId
from ...models.models import Class, UpdateClass, SensorReading, ClassOut

router = APIRouter()

@router.post("/", response_model=ClassOut, status_code=201)
async def create_class(cls: Class):
    await cls.insert()
    return cls

@router.get("/", response_model=List[ClassOut])
async def get_all_classes():
    return await Class.find_all().to_list()

@router.put("/{id}", response_model=ClassOut)
async def update_class(id: PydanticObjectId, cls_update: UpdateClass):
    cls = await Class.get(id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    update_data = cls_update.model_dump(exclude_unset=True)
    if update_data:
        await cls.update({"$set": update_data})
    return await Class.get(id)

@router.delete("/{id}", status_code=204)
async def delete_class(id: PydanticObjectId):
    cls_to_delete = await Class.get(id)
    if not cls_to_delete:
        raise HTTPException(status_code=404, detail="Class not found")
    await SensorReading.find(SensorReading.session_id == str(id)).delete()
    await cls_to_delete.delete()
    return None