import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { User } from "@supabase/supabase-js";
import Auth from "./components/Auth";
import MapForm from "./components/MapForm";
import MemoriesList from "./components/MemoriesList";
import Community from "./components/Community";
import Profile from "./components/Profile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<"list" | "add" | "community" | "profile">("list");
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

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = view === "add" ? "hidden" : "auto";
    
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [view]);

    if (!user) return <Auth />;

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${
                darkMode ? "bg-[#1e1e20] text-gray-100" : "bg-gray-100 text-gray-800"
            }`}
        >
            <div className="w-full max-w-[1800px] mx-auto px-1 py-5 space-y-5">
                {/* Nagłówek */}
                <header className="flex justify-between items-center pb-4 border-b border-gray-300 dark:border-gray-700">
                    <a href="/" className="flex items-center gap-3 select-none cursor-pointer self-center">
                        <img src="/icon.png" className="h-14 w-14" />
                        <h1 className="text-2xl font-bold tracking-tight">TrailBack</h1>
                    </a>

                    <nav className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setView("list")}
                            className={`nav-link ${view === "list" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                        >
                            📖 Wspomnienia
                        </button>
                        <button
                            onClick={() => setView("add")}
                            className={`nav-link ${view === "add" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                        >
                            ➕ Dodaj wspomnienie
                        </button>
                        <button
                            onClick={() => setView("community")}
                            className={`nav-link ${view === "community" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                        >
                            🤝 Społeczność
                        </button>
                        <button
                            onClick={() => setView("profile")}
                            className={`nav-link ${view === "profile" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                        >
                            🙋 Mój profil
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            className="nav-link w-[110px] h-[40px] flex items-center justify-center gap-1"
                            title="Przełącz motyw"
                        >
                            <span>🌓</span>
                            <span>{darkMode ? "Ciemny" : "Jasny"}</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="nav-link text-red-500"
                        >
                            🚪 Wyloguj
                        </button>
                    </nav>
                </header>

                {/* Widok */}
                <main className="fade-in">
                    {view === "list" && <MemoriesList darkMode={darkMode} />}
                    {view === "add" && <MapForm darkMode={darkMode} />}
                    {view === "community" && <Community userId={user.id} />}
                    {view === "profile" && <Profile user={user} />}
                </main>
            </div>
            <ToastContainer position="bottom-center" autoClose={3000} />
        </div>
    );
}

export default App;
