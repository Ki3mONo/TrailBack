import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { User } from "@supabase/supabase-js";
import Auth from "./components/Auth";
import MapForm from "./components/MapForm";
import MemoriesList from "./components/MemoriesList";
import Social from "./components/Social"; // 👈 NOWY komponent
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<"list" | "add" | "social">("list");
    const [darkMode, setDarkMode] = useState<boolean>(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark") setDarkMode(true);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode((prev) => !prev);

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

        const shouldBlockScroll = view === "add" || view === "social";
        document.body.style.overflow = shouldBlockScroll ? "hidden" : "auto";

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
                            onClick={() => setView("social")}
                            className={`nav-link ${view === "social" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                        >
                            🧑‍🤝‍🧑 Społeczność
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

                <main className="fade-in">
                    {view === "list" && <MemoriesList darkMode={darkMode} />}
                    {view === "add" && <MapForm darkMode={darkMode} />}
                    {view === "social" && <Social user={user} />}
                </main>
            </div>
            <ToastContainer position="bottom-center" autoClose={3000} />
        </div>
    );
}

export default App;
