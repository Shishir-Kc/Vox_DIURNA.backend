from sqlmodel import SQLModel,Field
import uuid
from  datetime import datetime
from typing import Optional

# need to add one - many relatopn ship with post and the images ! 

class Post(SQLModel,table=True):
    id:uuid.UUID = Field(primary_key=True,index=True,default_factory=uuid.uuid4)
    slug:str
    title:str =Field(max_length=255)
    excerpt:str
    content:str 
    date:datetime=Field(default_factory=datetime.utcnow)
    category:str
    readingTime:str
    fatured:bool
  
