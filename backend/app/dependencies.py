from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .models import User, Student
from .schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=payload.get("role"))
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_student(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Not a student")
    student = db.query(Student).filter(Student.usn == current_user.username).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

def get_placement_head(current_user: User = Depends(get_current_user)):
    if current_user.role != "PLACEMENT_HEAD":
        raise HTTPException(status_code=403, detail="Not a placement head")
    return current_user
