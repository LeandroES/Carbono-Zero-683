# app/api/routers/reports.py
from fastapi import APIRouter
from ...models.models import SensorReading

router = APIRouter()

@router.get("/class-rankings")
async def get_class_rankings():
    pipeline = [
        {"$match": {"session_id": {"$regex": "^[a-f0-9]{24}$"}}},
        {"$group": {"_id": "$session_id", "avgCo2": {"$avg": "$co2"}}},
        {"$addFields": {"class_id": {"$toObjectId": "$_id"}}},
        {"$lookup": {"from": "classes", "localField": "class_id", "foreignField": "_id", "as": "classDetails"}},
        {"$unwind": "$classDetails"},
        {"$sort": {"avgCo2": -1}},
        {"$project": {"id": "$_id", "name": "$classDetails.name", "avgCo2": "$avgCo2", "_id": 0}}
    ]
    rankings = await SensorReading.aggregate(pipeline).to_list()
    return rankings