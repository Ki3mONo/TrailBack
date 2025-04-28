import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import EditProfileModal from "./EditProfileModal";
import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const Profile = ({ user }: { user: SupabaseUser }) => {
    const [profile, setProfile] = useState<any>(null);
    const [showEdit, setShowEdit] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE}/profile`, {
                params: { user_id: user.id },
            });
            setProfile(res.data);
        } catch (error) {
            console.error("Błąd podczas pobierania profilu:", error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user.id]);

    if (!profile) return <div className="text-center">Ładowanie profilu...</div>;

    return (
        <div className="bg-white dark:bg-[#2a2a2d] p-6 rounded-lg shadow-lg w-full max-w-full text-center space-y-6">
            {/* AVATAR */}
            <div className="flex justify-center">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-600 shadow-xl">
                    <img
                        src={profile.avatar_url?.trim() ? profile.avatar_url : "/placeholder-avatar.png"}
                        alt="Avatar"
                        className="object-cover w-full h-full"
                    />
                </div>
            </div>

            {/* INFORMACJE */}
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">{profile.full_name || "Brak imienia"}</h2>
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
                    onSaved={fetchProfile}
                />
            )}
        </div>
    );
};

export default Profile;