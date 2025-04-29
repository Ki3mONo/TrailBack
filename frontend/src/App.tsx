import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./hooks/auth/useAuth.ts";
import { useDarkMode } from "./hooks/app/useDarkMode.ts";
import Auth from "./components/auth/Auth.tsx";
import Social from "./components/social/Social.tsx";
import MemoryMapView from "./components/map/MemoryMapView.tsx";
import Header from "./components/common/Header.tsx";

function App() {
    const { user, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const [view, setView] = useState<"map" | "social">("map");
    const [menuOpen, setMenuOpen] = useState(false);

    if (!user) return <Auth />;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#1e1e20] text-gray-100" : "bg-gray-100 text-gray-800"}`}>
            <div className="w-full max-w-[1900px] mx-auto px-3 sm:px-6 pt-2 pb-5 space-y-4">
                <Header
                    view={view}
                    setView={setView}
                    toggleDarkMode={toggleDarkMode}
                    darkMode={darkMode}
                    logout={logout}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                />

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
