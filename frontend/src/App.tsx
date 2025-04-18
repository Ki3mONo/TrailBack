import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { User } from "@supabase/supabase-js";
import Auth from "./components/Auth";
import MapForm from "./components/MapForm";
import MemoriesList from "./components/MemoriesList";

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<"list" | "add">("list");
    const [darkMode, setDarkMode] = useState<boolean>(false);

    // Ładowanie dark mode z localStorage
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark") {
            setDarkMode(true);
        }
    }, []);

    // Zmiana klasy .dark na <html> + zapis do localStorage
    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode((prev) => !prev);
    };

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
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4 py-6 transition-colors">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex justify-between items-center pb-4 border-b border-gray-300 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <img src="/icon.png" alt="TrailBack logo" className="h-20 w-20" />
                        {/* <h1 className="text-3xl font-bold text-blue-600">TrailBack</h1> */}
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

                {/* Główny widok */}
                <main className="fade-in">
                    {view === "list" ? (
                        <MemoriesList darkMode={darkMode} />
                    ) : (
                        <MapForm darkMode={darkMode} />
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
