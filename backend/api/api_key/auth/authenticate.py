from fastapi import Security,HTTPException,status
from fastapi.security import APIKeyHeader
from dotenv import load_dotenv
from typing import Optional
import os 
load_dotenv()



api_key_header = APIKeyHeader(name="X-API-KEY",auto_error=False)

VALID_API_KEY =os.getenv("API_KEY") 


async def validate_api_key(
        api_key_from_header:Optional[str] = Security(api_key_header)
)->bool:
    if not api_key_from_header == VALID_API_KEY:
        print(api_key_from_header)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API KEY"

        )
    return True

