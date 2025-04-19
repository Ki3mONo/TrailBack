import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { User } from "@supabase/supabase-js";
import Auth from "./components/Auth";
import MapForm from "./components/MapForm";
import MemoriesList from "./components/MemoriesList";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<"list" | "add">("list");
    const [darkMode, setDarkMode] = useState<boolean>(false);

    // Pobranie motywu z localStorage
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark") setDarkMode(true);
    }, []);

    // Ustawienie klasy dark + zapis do localStorage
    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode((prev) => !prev);

    // Logika uwierzytelniania
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
        supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    if (!user) return <Auth />;

    return (
        <div className={`min-h-screen transition-colors duration-300 
            ${darkMode ? "bg-[#1e1e20] text-gray-100" : "bg-gray-100 text-gray-800"}`}>
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Nagłówek */}
                <header className="flex justify-between items-center pb-4 border-b border-gray-300 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <img src="/icon.png" alt="TrailBack logo" className="h-12 w-12" />
                        <h1 className="text-2xl font-bold tracking-tight">TrailBack</h1>
                    </div>

                    <nav className="flex items-center gap-2">
                        <button
                            onClick={() => setView("list")}
                            className={`nav-link ${view === "list" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                        >
                            📖 Lista
                        </button>
                        <button
                            onClick={() => setView("add")}
                            className={`nav-link ${view === "add" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                        >
                            ➕ Dodaj
                        </button>
                        <button
                            onClick={handleLogout}
                            className="nav-link text-red-500"
                        >
                            🚪 Wyloguj
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            className="nav-link"
                            title="Przełącz motyw"
                        >
                            🌓 {darkMode ? "Jasny" : "Ciemny"}
                        </button>
                    </nav>
                </header>

                {/* Widok */}
                <main className="fade-in">
                    {view === "list" ? (
                        <MemoriesList darkMode={darkMode} />
                    ) : (
                        <MapForm darkMode={darkMode} />
                    )}
                </main>
            </div>
            <ToastContainer position="bottom-center" autoClose={3000} />
        </div>
    );
}

export default App;
