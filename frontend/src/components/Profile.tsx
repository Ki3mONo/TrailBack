import { useEffect, useState } from "react";
import axios from "axios";
import { User } from "@supabase/supabase-js";
import EditProfileModal from "./EditProfileModal";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const Profile = ({ user }: { user: User }) => {
    const [profile, setProfile] = useState<any>(null);
    const [showEdit, setShowEdit] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const res = await axios.get(`${API_BASE}/profile`, {
                params: { user_id: user.id },
            });
            setProfile(res.data);
        };
        fetchProfile();
    }, [user.id]);

    if (!profile) return <div className="text-center">Ładowanie profilu...</div>;

    return (
        <div className="space-y-6 max-w-md mx-auto text-center">
            {/* AVATAR */}
            <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-600 shadow-lg">
                    <img
                        src={profile.avatar_url && profile.avatar_url.trim() !== "" ? profile.avatar_url : "/placeholder-avatar.png"}
                        alt="Podgląd avatar"
                        className="object-cover w-full h-full"
                    />
                </div>
            </div>

            {/* INFORMACJE */}
            <div className="space-y-2">
                <h2 className="text-xl font-bold">{profile.full_name || "Brak imienia"}</h2>
                <p className="text-sm text-gray-500">@{profile.username || "Brak nazwy"}</p>
                <button
                    className="btn mt-4"
                    onClick={() => setShowEdit(true)}
                >
                    ✏️ Edytuj profil
                </button>
            </div>

            {/* MODAL */}
            {showEdit && (
                <EditProfileModal
                    userId={user.id}
                    initial={{
                        full_name: profile.full_name || "",
                        username: profile.username || "",
                        avatar_url: profile.avatar_url,
                    }}
                    onClose={() => setShowEdit(false)}
                    onSaved={async () => {
                        const res = await axios.get(`${API_BASE}/profile`, {
                            params: { user_id: user.id },
                        });
                        setProfile(res.data);
                    }}
                />
            )}
        </div>
    );
};

export default Profile;
