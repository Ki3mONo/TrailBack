import { FC } from "react";

interface HeaderProps {
    view: "map" | "social";
    setView: (view: "map" | "social") => void;
    toggleDarkMode: () => void;
    darkMode: boolean;
    logout: () => void;
    menuOpen: boolean;
    setMenuOpen: (open: boolean) => void;
}

const Header: FC<HeaderProps> = ({
                                     view,
                                     setView,
                                     toggleDarkMode,
                                     darkMode,
                                     logout,
                                     menuOpen,
                                     setMenuOpen,
                                 }) => {
    return (
        <header className="pb-4 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
                {/* Logo */}
                <a href="/" className="flex items-center gap-3 select-none cursor-pointer">
                    <img src="/icon.png" className="h-14 w-14" alt="TrailBack Logo" />
                    <h1 className="text-2xl font-bold tracking-tight">TrailBack</h1>
                </a>

                {/* Hamburger button */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden nav-link"
                    aria-label="Menu"
                >
                    ☰
                </button>

                {/* Desktop navigation */}
                <nav className="hidden md:flex items-center gap-2 flex-wrap">
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
                        onClick={logout}
                        className="nav-link text-red-500"
                    >
                        🚪 Wyloguj
                    </button>
                </nav>
            </div>

            {/* Mobile navigation */}
            {menuOpen && (
                <nav className="flex flex-col gap-2 mt-4 md:hidden">
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
                        onClick={() => { logout(); setMenuOpen(false); }}
                        className="nav-link text-red-500"
                    >
                        🚪 Wyloguj
                    </button>
                </nav>
            )}
        </header>
    );
};

export default Header;
