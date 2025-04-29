import { useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Community from "./Community.tsx";
import Profile from "./Profile.tsx";
import FriendList from "./FriendList.tsx";
import { AppUser } from "../../types/types.ts";

const Social = ({ user }: { user: SupabaseUser }) => {
    const [friends, setFriends] = useState<AppUser[]>([]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 w-full px-3 sm:px-6 pt-4 pb-8">
            {/* Lewa sekcja */}
            <div className="w-full lg:w-3/4 flex flex-col space-y-4">
                <h2 className="text-2xl font-semibold border-b pb-2">👥 Społeczność</h2>
                <Community userId={user.id} onFriendsLoaded={setFriends} />
            </div>

            {/* Prawa sekcja */}
            <div className="w-full lg:w-1/4 flex flex-col items-center space-y-4 sticky top-4 self-start">
                <h2 className="text-2xl font-semibold border-b pb-2 w-full text-center">🙋 Twój profil</h2>
                <Profile user={user} />
                <FriendList friends={friends} />
            </div>
        </div>
    );
};

export default Social;
