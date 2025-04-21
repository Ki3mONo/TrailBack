import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { User } from "@supabase/supabase-js";
import Auth from "./components/Auth";
import Social from "./components/Social";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MemoryMapView from "./components/MemoryMapView";

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<"map" | "social">("map");
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);

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

    if (!user) return <Auth />;

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${
                darkMode ? "bg-[#1e1e20] text-gray-100" : "bg-gray-100 text-gray-800"
            }`}
        >
            <div className="w-full max-w-[1900px] mx-auto px-3 sm:px-6 pt-2 pb-5 space-y-4">
                <header className="pb-4 border-b border-gray-300 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <a href="/" className="flex items-center gap-3 select-none cursor-pointer">
                            <img src="/icon.png" className="h-14 w-14" />
                            <h1 className="text-2xl font-bold tracking-tight">TrailBack</h1>
                        </a>

                        {/* Mobile menu toggle button */}
                        <button
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="sm:hidden nav-link"
                        >
                            ☰
                        </button>

                        {/* Desktop nav */}
                        <nav className="hidden sm:flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setView("map")}
                                className={`nav-link ${view === "map" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                            >
                                🗺️ Mapa wspomnień
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
                    </div>

                    {/* Mobile nav */}
                    {menuOpen && (
                        <nav className="flex flex-col gap-2 mt-4 sm:hidden">
                            <button
                                onClick={() => { setView("map"); setMenuOpen(false); }}
                                className={`nav-link ${view === "map" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                            >
                                🗺️ Mapa wspomnień
                            </button>
                            <button
                                onClick={() => { setView("social"); setMenuOpen(false); }}
                                className={`nav-link ${view === "social" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
                            >
                                🧑‍🤝‍🧑 Społeczność
                            </button>
                            <button
                                onClick={() => { toggleDarkMode(); setMenuOpen(false); }}
                                className="nav-link"
                            >
                                🌓 {darkMode ? "Ciemny" : "Jasny"}
                            </button>
                            <button
                                onClick={() => { handleLogout(); setMenuOpen(false); }}
                                className="nav-link text-red-500"
                            >
                                🚪 Wyloguj
                            </button>
                        </nav>
                    )}
                </header>

                <main className="fade-in">
                    {view === "map" && <MemoryMapView darkMode={darkMode} />}
                    {view === "social" && <Social user={user} />}
                </main>
            </div>

            <ToastContainer position="bottom-center" autoClose={3000} />
        </div>
    );
}

export default App;
