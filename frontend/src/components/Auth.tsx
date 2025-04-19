import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoginMode, setIsLoginMode] = useState(true);

    const handleLogin = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setErrorMessage(error.message);
            console.error(error.message);
        } else {
            console.log("Zalogowano pomyślnie!", data);
            window.location.href = "/";
        }
    };

    const handleRegister = async () => {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setErrorMessage(error.message);
            console.error(error.message);
        } else {
            console.log("Rejestracja pomyślna!", data);
            window.location.href = "/";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
