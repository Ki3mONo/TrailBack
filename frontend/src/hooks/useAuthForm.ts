import { useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";

export function useAuthForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoginMode, setIsLoginMode] = useState(true);

    const handleSubmit = async () => {
        if (!email || !password) {
            toast.error("Email i hasło są wymagane.");
            return;
        }

        try {
            if (isLoginMode) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast.success("Zalogowano pomyślnie!");
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                toast.success("Konto utworzone. Sprawdź email!");
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Wystąpił nieznany błąd.");
            }
        }
    };

    const toggleMode = () => setIsLoginMode((prev) => !prev);

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoginMode,
        toggleMode,
        handleSubmit,
    };
}
