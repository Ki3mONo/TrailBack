import { useState } from "react";
import { supabase } from "../../supabaseClient.ts";
import { toast } from "react-toastify";

export function useAuthForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // nullable

    const handleSubmit = async () => {
        if (!email || !password) {
            const message = "Email i hasło są wymagane.";
            toast.error(message);
            setErrorMessage(message);
            return;
        }

        try {
            if (isLoginMode) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast.success("Zalogowano pomyślnie!");
                setErrorMessage(null);
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                toast.success("Konto utworzone. Sprawdź email!");
                setErrorMessage(null);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
                setErrorMessage(error.message);
            } else {
                toast.error("Wystąpił nieznany błąd.");
                setErrorMessage("Wystąpił nieznany błąd.");
            }
        }
    };

    const toggleMode = () => {
        setIsLoginMode((prev) => !prev);
        setErrorMessage(null);
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoginMode,
        toggleMode,
        handleSubmit,
        errorMessage,
    };
}
