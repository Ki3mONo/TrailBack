import { useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";

import Community, { AppUser } from "./Community";
import Profile from "./Profile";
import FriendList from "./FriendList";

const Social = ({ user }: { user: SupabaseUser }) => {
    const [friends, setFriends] = useState<AppUser[]>([]);

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-150px)] overflow-hidden">
            {/* Sekcja znajomych i społeczności */}
            <div className="w-full md:w-3/4 flex flex-col space-y-4 h-full overflow-hidden">
                <h2 className="text-2xl font-semibold border-b pb-2">👥 Społeczność</h2>
                <Community userId={user.id} onFriendsLoaded={setFriends} />
            </div>

            {/* Sekcja profilu + znajomi */}
            <div className="w-full md:w-1/4 flex flex-col items-center space-y-4 h-full">
                <h2 className="text-2xl font-semibold border-b pb-2 w-full text-center">🙋 Twój profil</h2>
                <Profile user={user} />
                <FriendList friends={friends} />
            </div>
        </div>
    );
};

export default Social;
