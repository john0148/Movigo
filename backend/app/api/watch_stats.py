"""
Watch Statistics API
 
Handles endpoints for user watch statistics including:
- Getting aggregate watch stats (total time, favorite genres)
- Fetching time-based statistics (weekly, monthly, yearly)
- Retrieving watch history with details and pagination
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import Optional, List
import logging

from ..crud.watch_history import WatchHistoryCRUD
from ..crud.watch_later import WatchLaterCRUD
from ..dependencies import get_watch_history_crud, get_watch_later_crud, get_current_user
from ..schemas.profile import (
    WatchStatsResponse, 
    WatchHistoryResponse, 
    WatchHistoryEntry,
    WatchLaterResponse,
    WatchLaterEntry
)
from ..schemas.user import UserInDB

router = APIRouter(tags=["watch-stats"])
logger = logging.getLogger(__name__)

@router.get("/stats", response_model=WatchStatsResponse)
async def get_user_watch_stats(
    user: UserInDB = Depends(get_current_user),
    watch_history_crud: WatchHistoryCRUD = Depends(get_watch_history_crud)
):
    """
    Get watch statistics for the current user.
    
    Returns aggregate statistics including:
    - Total movies watched
    - Total watch time in minutes
    - Favorite genre
    - Weekly, monthly, and yearly watch data
    
    Args:
        user: Current authenticated user from token
        watch_history_crud: WatchHistoryCRUD dependency
        
    Returns:
        WatchStatsResponse: Stats data for the user
    """
    logger.info(f"Getting watch stats for user {user.id}")
    
    try:
        stats = await watch_history_crud.get_user_stats(user.id)
        return WatchStatsResponse(**stats)
    except Exception as e:
        logger.exception(f"Error getting watch stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching watch statistics"
        )

@router.get("/history", response_model=WatchHistoryResponse)
async def get_user_watch_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    user: UserInDB = Depends(get_current_user),
    watch_history_crud: WatchHistoryCRUD = Depends(get_watch_history_crud)
):
    """
    Get paginated watch history for the current user.
    
    Args:
        page: Page number (starting at 1)
        limit: Number of items per page
        user: Current authenticated user from token
        watch_history_crud: WatchHistoryCRUD dependency
        
    Returns:
        WatchHistoryResponse: Paginated watch history data
    """
    logger.info(f"Getting watch history for user {user.id}, page={page}, limit={limit}")
    
    try:
        skip = (page - 1) * limit
        
        # Get watch history entries
        history_items = await watch_history_crud.get_user_history(
            user_id=user.id,
            skip=skip,
            limit=limit
        )
        
        # Get total count for pagination
        total_count = await watch_history_crud.count_user_history(user_id=user.id)
        
        return WatchHistoryResponse(
            items=history_items,
            total=total_count,
            page=page,
            limit=limit
        )
    except Exception as e:
        logger.exception(f"Error getting watch history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching watch history"
        )

@router.get("/history/{entry_id}", response_model=WatchHistoryEntry)
async def get_watch_history_entry(
    entry_id: str = Path(..., description="Watch history entry ID"),
    user: UserInDB = Depends(get_current_user),
    watch_history_crud: WatchHistoryCRUD = Depends(get_watch_history_crud)
):
    """
    Get details for a specific watch history entry.
    
    Args:
        entry_id: Watch history entry ID
        user: Current authenticated user from token
        watch_history_crud: WatchHistoryCRUD dependency
        
    Returns:
        WatchHistoryEntry: Detailed watch history entry
        
    Raises:
        HTTPException(404): If entry not found
        HTTPException(403): If entry doesn't belong to user
    """
    logger.info(f"Getting watch history entry {entry_id} for user {user.id}")
    
    try:
        entry = await watch_history_crud.get(entry_id)
        
        if not entry:
            raise HTTPException(status_code=404, detail="Watch history entry not found")
            
        # Verify this entry belongs to the current user
        if entry.user_id != user.id:
            logger.warning(f"User {user.id} attempted to access entry {entry_id} belonging to user {entry.user_id}")
            raise HTTPException(status_code=403, detail="Not authorized to access this entry")
            
        return entry
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting watch history entry: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching the watch history entry"
        )

@router.delete("/history/{entry_id}", status_code=204)
async def delete_watch_history_entry(
    entry_id: str = Path(..., description="Watch history entry ID"),
    user: UserInDB = Depends(get_current_user),
    watch_history_crud: WatchHistoryCRUD = Depends(get_watch_history_crud)
):
    """
    Delete a specific watch history entry.
    
    Args:
        entry_id: Watch history entry ID
        user: Current authenticated user from token
        watch_history_crud: WatchHistoryCRUD dependency
        
    Returns:
        None
        
    Raises:
        HTTPException(404): If entry not found
        HTTPException(403): If entry doesn't belong to user
    """
    logger.info(f"Deleting watch history entry {entry_id} for user {user.id}")
    
    try:
        # First, get the entry to verify ownership
        entry = await watch_history_crud.get(entry_id)
        
        if not entry:
            raise HTTPException(status_code=404, detail="Watch history entry not found")
            
        # Verify this entry belongs to the current user
        if entry.user_id != user.id:
            logger.warning(f"User {user.id} attempted to delete entry {entry_id} belonging to user {entry.user_id}")
            raise HTTPException(status_code=403, detail="Not authorized to delete this entry")
        
        # Delete the entry
        success = await watch_history_crud.delete(entry_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete watch history entry")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting watch history entry: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while deleting the watch history entry"
        )

@router.get("/later", response_model=WatchLaterResponse)
async def get_user_watch_later(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    user: UserInDB = Depends(get_current_user),
    watch_later_crud: WatchLaterCRUD = Depends(get_watch_later_crud)
):
    """
    Get paginated watch later list for the current user.
    
    Args:
        page: Page number (starting at 1)
        limit: Number of items per page
        user: Current authenticated user from token
        watch_later_crud: WatchLaterCRUD dependency
        
    Returns:
        WatchLaterResponse: Paginated watch later data
    """
    logger.info(f"Getting watch later list for user {user.id}, page={page}, limit={limit}")
    
    try:
        skip = (page - 1) * limit
        
        # Get watch later entries
        later_items = await watch_later_crud.get_user_list(
            user_id=user.id,
            skip=skip,
            limit=limit
        )
        
        # Get total count for pagination
        total_count = await watch_later_crud.count_user_list(user_id=user.id)
        
        return WatchLaterResponse(
            items=later_items,
            total=total_count,
            page=page,
            limit=limit
        )
    except Exception as e:
        logger.exception(f"Error getting watch later list: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching watch later list"
        )

@router.get("/later/{entry_id}", response_model=WatchLaterEntry)
async def get_watch_later_entry(
    entry_id: str = Path(..., description="Watch later entry ID"),
    user: UserInDB = Depends(get_current_user),
    watch_later_crud: WatchLaterCRUD = Depends(get_watch_later_crud)
):
    """
    Get details for a specific watch later entry.
    
    Args:
        entry_id: Watch later entry ID
        user: Current authenticated user from token
        watch_later_crud: WatchLaterCRUD dependency
        
    Returns:
        WatchLaterEntry: Detailed watch later entry
        
    Raises:
        HTTPException(404): If entry not found
        HTTPException(403): If entry doesn't belong to user
    """
    logger.info(f"Getting watch later entry {entry_id} for user {user.id}")
    
    try:
        entry = await watch_later_crud.get(entry_id)
        
        if not entry:
            raise HTTPException(status_code=404, detail="Watch later entry not found")
            
        # Verify this entry belongs to the current user
        if entry.user_id != user.id:
            logger.warning(f"User {user.id} attempted to access entry {entry_id} belonging to user {entry.user_id}")
            raise HTTPException(status_code=403, detail="Not authorized to access this entry")
            
        return entry
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting watch later entry: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching the watch later entry"
        )

@router.delete("/later/{entry_id}", status_code=204)
async def delete_watch_later_entry(
    entry_id: str = Path(..., description="Watch later entry ID"),
    user: UserInDB = Depends(get_current_user),
    watch_later_crud: WatchLaterCRUD = Depends(get_watch_later_crud)
):
    """
    Delete a specific watch later entry.
    
    Args:
        entry_id: Watch later entry ID
        user: Current authenticated user from token
        watch_later_crud: WatchLaterCRUD dependency
        
    Returns:
        None
        
    Raises:
        HTTPException(404): If entry not found
        HTTPException(403): If entry doesn't belong to user
    """
    logger.info(f"Deleting watch later entry {entry_id} for user {user.id}")
    
    try:
        # First, get the entry to verify ownership
        entry = await watch_later_crud.get(entry_id)
        
        if not entry:
            raise HTTPException(status_code=404, detail="Watch later entry not found")
            
        # Verify this entry belongs to the current user
        if entry.user_id != user.id:
            logger.warning(f"User {user.id} attempted to delete entry {entry_id} belonging to user {entry.user_id}")
            raise HTTPException(status_code=403, detail="Not authorized to delete this entry")
        
        # Delete the entry
        success = await watch_later_crud.delete(entry_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete watch later entry")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting watch later entry: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while deleting the watch later entry"
        ) 