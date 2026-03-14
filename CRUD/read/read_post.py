from sqlmodel import Session,select
from fastapi import Depends
from database.model.post.post_content import Post

def read_posts(session:Session):
    try:
     model_querry = select(Post)
     respose_model = session.exec(model_querry).all()
     return respose_model

    except Exception as e:
       print(e)
  