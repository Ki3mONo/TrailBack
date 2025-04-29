import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../../supabaseClient.ts";
import { ShareMemoryService } from "../../services/shareMemoryService.ts";
import { FriendProfile, ShareRecord } from "../../types/types.ts";

export function useShareMemoryModal(memoryId: string) {
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [shares, setShares] = useState<ShareRecord[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [confirmUnshareId, setConfirmUnshareId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    toast.error("Nie jesteś zalogowany");
                    return;
                }
                setCurrentUserId(user.id);

                const friendsData = await ShareMemoryService.getFriends(user.id);
                setFriends(friendsData);

                const sharesData = await ShareMemoryService.getShares(memoryId);
                setShares(sharesData);
            } catch (err) {
                console.error(err);
                toast.error("Błąd ładowania danych");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [memoryId]);

    const alreadySharedWith = (friendId: string) =>
        shares.some(s =>
            (s.shared_with === friendId && s.shared_by === currentUserId) ||
            (s.shared_with === currentUserId && s.shared_by === friendId)
        );

    const isOwner = (friendId: string) =>
        shares.some(s => s.shared_with === friendId && s.shared_by === currentUserId);

    const shareWith = async (friendId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("Brak użytkownika");

        try {
            await ShareMemoryService.shareMemory(memoryId, friendId, user.id);
            setShares(prev => [...prev, { shared_with: friendId, shared_by: user.id }]);
            toast.success("Wspomnienie udostępnione!");
        } catch {
            toast.error("Nie udało się udostępnić wspomnienia");
        }
    };

    const confirmUnshare = (friendId: string) => {
        setConfirmUnshareId(friendId);
    };

    const unshareWith = async () => {
        if (!confirmUnshareId) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("Brak użytkownika");

        try {
            await ShareMemoryService.unshareMemory(memoryId, confirmUnshareId, user.id);
            setShares(prev =>
                prev.filter(s => !(s.shared_with === confirmUnshareId && s.shared_by === user.id))
            );
            toast.success("Udostępnienie cofnięte");
        } catch {
            toast.error("Nie udało się cofnąć udostępnienia");
        }

        setConfirmUnshareId(null);
    };

    return {
        friends,
        shares,
        loading,
        confirmUnshareId,
        alreadySharedWith,
        isOwner,
        shareWith,
        confirmUnshare,
        unshareWith,
        setConfirmUnshareId,
    };
}
