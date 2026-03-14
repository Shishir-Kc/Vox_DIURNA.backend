from sqlmodel import create_engine,Session
from typing import Annotated
from fastapi import Depends
from dotenv import load_dotenv
import os
load_dotenv()

db_url=os.getenv("DATABASE_URL")
engine = create_engine(url=db_url)

def get_sesison():
    with Session(engine) as session:
        yield session

Session_Dep = Annotated[Session,Depends(get_sesison)]

