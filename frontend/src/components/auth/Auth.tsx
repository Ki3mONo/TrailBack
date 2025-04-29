import { useEffect } from "react";
import { useAuthForm } from "../../hooks/useAuthForm.ts";
import { useDarkMode } from "../../hooks/useDarkMode.ts";

export default function Auth() {
    const { darkMode } = useDarkMode();
    const {
        email,
        setEmail,
        password,
        setPassword,
        errorMessage,
        isLoginMode,
        toggleMode,
        handleSubmit,
    } = useAuthForm();

    useEffect(() => {
    }, [darkMode]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSubmit();
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
                        onKeyDown={handleKeyDown} // dodane
                        placeholder="Wprowadź email"
                        className="input"
                    />

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown} // dodane
                        placeholder="Wprowadź hasło"
                        className="input"
                    />

                    {errorMessage && (
                        <p className="text-red-500 text-sm">{errorMessage}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        className="btn-primary w-full"
                    >
                        {isLoginMode ? "Zaloguj" : "Zarejestruj"}
                    </button>
                </div>

                <div className="text-center pt-4 border-t text-sm">
                    <button
                        onClick={toggleMode}
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
