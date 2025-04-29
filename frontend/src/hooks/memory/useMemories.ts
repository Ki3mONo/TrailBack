import { useState, useEffect } from "react";
import { Memory } from "../../types/types.ts";
import { fetchOwnAndSharedMemories } from "../../services/memoriesService.ts";
import { supabase } from "../../supabaseClient.ts";
import { toast } from "react-toastify";

export function useMemories(mode: "list" | "add") {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    toast.error("Użytkownik niezalogowany");
                    return;
                }
                setCurrentUserId(user.id);

                if (mode === "list") {
                    const memories = await fetchOwnAndSharedMemories(user.id);
                    setMemories(memories);
                }
            } catch (err) {
                toast.error("Błąd ładowania wspomnień");
                console.error(err);
            }
        }

        fetch();
    }, [mode]);

    return { memories, setMemories, currentUserId };
}
