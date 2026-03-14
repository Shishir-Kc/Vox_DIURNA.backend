from sqlmodel import Field
from datetime import datetime
from pydantic import BaseModel 
import uuid

class Post(BaseModel):
    slug:str
    title:str =Field(max_length=255)
    excerpt:str
    content:str 
    category:str
    readingTime:str
    fatured:bool
    
class Post_Read(BaseModel):
    id:uuid.UUID
    slug:str
    title:str 
    excerpt:str
    date:datetime
    content:str
    category:str
    readingTime:str
    fatured:bool
    
class Post_Preview(BaseModel):
    id:uuid.UUID
    slug:str
    title:str 
    excerpt:str
    date:datetime
    category:str
    readingTime:str
    fatured:bool
    
class Post_Search(BaseModel):
    id:uuid.UUID
    slug:str