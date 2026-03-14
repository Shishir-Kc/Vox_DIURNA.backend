from .verion_1_api.router import router as verson_1_api
from fastapi import APIRouter

router = APIRouter(prefix="/v1")
router.include_router(verson_1_api)