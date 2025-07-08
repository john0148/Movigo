from fastapi import APIRouter, Depends
from app.core.security import require_admin
from app.db.models.user import UserModel

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
async def admin_dashboard(current_user: UserModel = Depends(require_admin)):
    return {"message": f"Xin chào Admin {current_user.email}!"}
