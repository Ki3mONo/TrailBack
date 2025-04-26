from pydantic import BaseModel

class FriendOut(BaseModel):
    user_id: str
    friend_id: str
    status: str  # 'pending' | 'accepted'
