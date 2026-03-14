from sqlmodel import Session,select
from fastapi import Depends, HTTPException
from database.model.post.post_content import Post
from database.schema.upload.post import Post_Search

def create_post(post:Post,session:Session):
    try:
     model = Post(**post.model_dump())
     session.add(model)
     session.commit()
     session.refresh(model)
     return True

    except Exception as e:
       print(e)
       return False
    
def get_single_post(session: Session, post: Post_Search):
    try:
        query = select(Post).where((Post.id == post.id) & (Post.slug == post.slug))
        response = session.exec(query).first()
        if not response:
            raise HTTPException(status_code=404, detail="Post not found")
        return response
    except Exception as e:
        print(f"Error in get_single_post: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Internal server error")

   
   