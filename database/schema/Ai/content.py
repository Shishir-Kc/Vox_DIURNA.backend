from pydantic import BaseModel


class Content_Schema(BaseModel):
    content: str
