from fastapi import APIRouter,status,HTTPException,Request,Depends
import time
from database.schema.upload.post import Post,Post_Read,Post_Preview
from CRUD.upload.post import create_post,get_single_post
from database.connnection.connector import Session_Dep
from CRUD.read.read_post import read_posts
from database.schema.upload.post import Post_Search
from api.api_key.auth.authenticate import validate_api_key
from api.rate_limiter import limiter

import uuid
router = APIRouter()

@router.get("/")
def server_home():
    return {"status":status.HTTP_200_OK}

@router.get("/posts",response_model=list[Post_Preview])
@limiter.limit('5/minutes')
def get_posts(request:Request,session:Session_Dep):
    return read_posts(session=session)

@router.post("/upload/post")
@limiter.limit('5/minutes')
def upload_post(request:Request,post_schema:Post,session:Session_Dep,api_key=Depends(validate_api_key)):
    if not create_post(post_schema,session=session):
        HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST
        )
    return{"status":status.HTTP_202_ACCEPTED}


@router.get("/posts/{slug}/{id}",response_model=Post_Read)
def retrive_single_post(slug:str,id:uuid.UUID,session:Session_Dep):
    post = Post_Search(slug=slug,id=id)
    return get_single_post(session=session,post=post)