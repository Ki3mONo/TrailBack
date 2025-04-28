import { useState } from "react";
import { supabase } from "../supabaseClient";

export function useAuthForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoginMode, setIsLoginMode] = useState(true);

    const handleSubmit = async () => {
        setErrorMessage("");

        if (!email || !password) {
            setErrorMessage("Email i hasło są wymagane.");
            return;
        }

        try {
            if (isLoginMode) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            }
        } catch (error: any) {
            setErrorMessage(error.message || "Wystąpił błąd.");
            console.error(error);
        }
    };

    const toggleMode = () => setIsLoginMode((prev) => !prev);

    return {
        email,
        setEmail,
        password,
        setPassword,
        errorMessage,
        isLoginMode,
        toggleMode,
        handleSubmit,
    };
}
