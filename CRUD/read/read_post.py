from sqlmodel import Session, select
from fastapi import Depends, HTTPException, status
import logging
from database.model.post.post_content import Post

logger = logging.getLogger(__name__)


def read_posts(session: Session):
    try:
        model_querry = select(Post)
        respose_model = session.exec(model_querry).all()
        return respose_model

    except Exception as e:
        logger.error(f"Error fetching posts: {e}")
        return []
