from fastapi import FastAPI
from contextlib import asynccontextmanager
from api import router
from api.rate_limiter import limiter
from slowapi.middleware import SlowAPIASGIMiddleware
from slowapi import _rate_limit_exceeded_handler
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware


@asynccontextmanager
async def lifespan(server: FastAPI):
    print("booting up")
    yield


server = FastAPI(
    title="VOX_DIURNA", version="1.0", lifespan=lifespan, docs_url="/", redoc_url=None
)

server.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://vox-diurna.pages.dev",
        "https://shishirkhatri.com.np",
        # "http://localhost",
        # "http://localhost:3000",
        # "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
server.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "vox-diurna-backend.onrender.com",
        "*.onrender.com",
        # "localhost",
        # "127.0.0.1",
        # "localhost:8000",
        # "127.0.0.1:8000",
    ],
)

server.state.limiter = limiter
server.add_middleware(SlowAPIASGIMiddleware)
server.add_exception_handler(429, _rate_limit_exceeded_handler)  # pyright: ignore[]
server.include_router(router, prefix="/api")
