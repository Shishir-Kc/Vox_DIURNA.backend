from fastapi import FastAPI
from contextlib import asynccontextmanager
from api import router
from api.rate_limiter import limiter
from slowapi.middleware import SlowAPIASGIMiddleware
from slowapi import _rate_limit_exceeded_handler


@asynccontextmanager
async def lifespan(server:FastAPI):
    print("booting up")
    yield

server=FastAPI(
    title="VOX_DIURNA",
    version="1.0",
    lifespan=lifespan,
    docs_url="/",
    redoc_url=None
)
server.state.limiter=limiter
server.add_middleware(SlowAPIASGIMiddleware)
server.add_exception_handler(429,_rate_limit_exceeded_handler)
server.include_router(router,prefix="/api")