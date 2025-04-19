import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoginMode, setIsLoginMode] = useState(true);

    // Sprawdzenie motywu przy montowaniu komponentu
    useEffect(() => {
        const theme = localStorage.getItem("theme");
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setErrorMessage(error.message);
            console.error(error.message);
        } else {
            console.log("Zalogowano pomyślnie!");
            // App.tsx przechwyci zmianę sesji i pokaże widok użytkownika
        }
    };

    const handleRegister = async () => {
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setErrorMessage(error.message);
            console.error(error.message);
        } else {
            console.log("Rejestracja pomyślna!");
            // App.tsx przechwyci zmianę sesji
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 transition-colors duration-300">
            <div className="card w-full max-w-md p-8 space-y-6">
                <h2 className="text-2xl font-bold text-center">
                    {isLoginMode ? "Zaloguj się" : "Zarejestruj się"}
                </h2>

                <div className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Wprowadź email"
                        className="input"
                    />

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Wprowadź hasło"
                        className="input"
                    />

                    {errorMessage && (
                        <p className="text-red-500 text-sm">{errorMessage}</p>
                    )}

                    <button
                        onClick={isLoginMode ? handleLogin : handleRegister}
                        className="btn-primary w-full"
                    >
                        {isLoginMode ? "Zaloguj" : "Zarejestruj"}
                    </button>
                </div>

                <div className="text-center pt-4 border-t text-sm">
                    <button
                        onClick={() => setIsLoginMode(!isLoginMode)}
                        className="text-blue-500 hover:underline"
                    >
                        {isLoginMode
                            ? "Nie masz konta? Zarejestruj się"
                            : "Masz już konto? Zaloguj się"}
                    </button>
                </div>
            </div>
        </div>
    );
}
