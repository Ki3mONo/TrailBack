import { Memory } from "../types/types";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export async function fetchOwnAndSharedMemories(userId: string): Promise<Memory[]> {
    const own = await fetch(`${API_BASE}/memories?user_id=${userId}`).then(res => res.json());
    const shared = await fetch(`${API_BASE}/memories/shared?user_id=${userId}`).then(res => res.json());

    const combined = [...own, ...shared];
    const unique = combined.filter((value, index, self) =>
        index === self.findIndex((m) => m.id === value.id)
    );

    return unique.map((m) => ({
        ...m,
        isShared: m.created_by !== userId,
    }));
}