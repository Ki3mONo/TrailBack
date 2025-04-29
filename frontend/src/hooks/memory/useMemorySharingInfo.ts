import { useEffect, useState } from "react";
import { MemoryService } from "../../services/memoryService.ts";
import { FriendProfile } from "../../types/types.ts";
import { toast } from "react-toastify";

export function useMemorySharingInfo(memoryId: string, ownerId: string) {
    const [owner, setOwner] = useState<FriendProfile | null>(null);
    const [sharedWith, setSharedWith] = useState<FriendProfile[]>([]);

    useEffect(() => {
        const loadSharingData = async () => {
            try {
                const ownerData = await MemoryService.getOwnerProfile(ownerId);
                setOwner(ownerData);

                const shares = await MemoryService.getMemoryShares(memoryId);
                const onlyOwnerShares = shares
                    .filter(s => s.shared_by === ownerId)
                    .map(s => s.shared_with);

                if (onlyOwnerShares.length === 0) {
                    setSharedWith([]);
                    return;
                }

                const allProfiles = await MemoryService.getUsersList(ownerId);
                const filtered = allProfiles.filter(u => onlyOwnerShares.includes(u.id));
                setSharedWith(filtered);
            } catch (error: unknown) {
                const err = error as { message?: string };
                console.error("Błąd pobierania danych do MemorySharingInfo", err);
                toast.error(err?.message || "Nie udało się pobrać informacji o udostępnieniach");
            }
        };

        loadSharingData();
    }, [memoryId, ownerId]);

    return {
        owner,
        sharedWith,
    };
}