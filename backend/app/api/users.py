from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from bson import ObjectId

from ..core.security import require_admin
from ..schemas.user import UserOut, UserUpdateRequest
from ..db.models.user import UserModel
from ..crud.user import (
    get_all_users_from_db,
    update_user,
    get_user_by_id
)

from ..crud import user as user_crud

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])

@router.get("/", response_model=List[UserOut])
async def list_all_users(current_user: UserModel = Depends(require_admin)):
    """
    Lấy danh sách tất cả user (chỉ cho admin)
    """
    users = await get_all_users_from_db()
    return [user_crud.UserCRUD.model_to_dict(u) for u in users]

@router.delete("/{user_id}", response_model=dict)
async def delete_user(user_id: str, current_user: UserModel = Depends(require_admin)):
    """
    Xóa user theo ID (chỉ cho admin)
    """
    success = await user_crud.delete_user_by_id(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy user để xoá")
    return {"message": "Xoá user thành công"}

@router.patch("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: str,
    new_role: str = Query(..., description="Vai trò mới: user hoặc admin"),
    current_user: UserModel = Depends(require_admin)
):
    """
    Cập nhật vai trò (role) của user (chỉ cho admin)
    """
    if new_role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Role không hợp lệ")

    updated = await update_user(user_id, {"role": new_role})  # ✅ không ép ObjectId
    if not updated:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")

    return user_crud.UserCRUD.model_to_dict(updated)

@router.put("/{user_id}", response_model=UserOut)
async def update_user_info(
    user_id: str,
    user_data: UserUpdateRequest,
    current_user: UserModel = Depends(require_admin)
):
    """
    Cập nhật thông tin user (chỉ cho admin)
    """
    update_fields = user_data.dict(exclude_unset=True)

    updated = await update_user(user_id, update_fields)  # ✅ Truyền user_id là str
    if not updated:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")

    return user_crud.UserCRUD.model_to_dict(updated)

