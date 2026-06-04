# Vox DIURNA Backend

Backend API for the Vox DIURNA blog platform, built with FastAPI and PostgreSQL.

## Tech Stack

- Python 3.12
- FastAPI
- SQLModel + SQLAlchemy
- PostgreSQL (psycopg2)
- Alembic (migrations)
- LangChain + Groq (AI spell checking)
- SlowAPI (rate limiting)

## Project Structure

```
├── main.py                  # FastAPI app entry point
├── api/
│   ├── __init__.py          # API router aggregation
│   ├── rate_limiter.py      # SlowAPI rate limiter config
│   ├── api_key/auth/        # API key authentication
│   └── verion_1_api/        # v1 endpoint routes
├── database/
│   ├── connnection/         # DB engine & session
│   ├── model/post/          # SQLModel table definitions
│   └── schema/              # Pydantic request/response schemas
├── CRUD/
│   ├── upload/              # Create operations
│   └── read/                # Read operations
├── Ai/
│   └── Cloud/               # Groq-based spell checking
├── alembic/                 # Database migrations
└── pyproject.toml
```

## API Endpoints

| Method | Path                      | Auth | Rate Limit | Description              |
|--------|---------------------------|------|------------|--------------------------|
| GET    | `/api/v1/ping`            | No   | 5/min      | Server status check      |
| GET    | `/api/v1/health`          | No   | 5/min      | Database health check    |
| GET    | `/api/v1/posts`           | No   | 5/min      | List all posts           |
| GET    | `/api/v1/posts/{slug}/{id}` | No | -          | Get single post          |
| POST   | `/api/v1/upload/post`     | Yes  | 5/min      | Create a post            |
| POST   | `/api/v1/check/spelling`  | Yes  | 5/min      | AI spell check content   |

## Environment Variables

Create a `.env` file:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
API_KEY=your-api-key
GROQ_API=your-groq-api-key
```

## Setup

```bash
# Clone and enter directory
git clone <repo-url> && cd Vox_DIURNA.backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:server --host 0.0.0.0 --port 8000
```

## Authentication

Protected endpoints require an `X-API-KEY` header:

```
X-API-KEY: your-api-key
```
