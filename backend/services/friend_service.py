from typing import List
from supabase import Client

from backend.schemas.friend import FriendOut

TABLE = "friendships"

def list_friends(db: Client, user_id: str) -> List[FriendOut]:
    """Return the list of friends and pending requests for a given user."""
    rows = (
        db.table(TABLE)
        .select("*")
        .or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}")
        .execute()
        .data
    )
    return [FriendOut(**r) for r in rows]

def send_request(db: Client, user_id: str, friend_id: str) -> None:
    """Send a pending friend request from user_id to friend_id."""
    db.table(TABLE).insert(
        {"user_id": user_id, "friend_id": friend_id, "status": "pending"}
    ).execute()

def accept_request(db: Client, user_id: str, friend_id: str) -> None:
    """Accept a pending friend request."""
    db.table(TABLE).update({"status": "accepted"}).match(
        {"user_id": friend_id, "friend_id": user_id, "status": "pending"}
    ).execute()

def remove_friend(db: Client, user_id: str, friend_id: str) -> None:
    """Remove the friendship between two users."""
    db.table(TABLE).delete().match({"user_id": user_id, "friend_id": friend_id}).execute()
    db.table(TABLE).delete().match({"user_id": friend_id, "friend_id": user_id}).execute()
