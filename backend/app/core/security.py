from passlib.context import CryptContext
from ..db.models.user import UserModel
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

class get_current_user():
    pass