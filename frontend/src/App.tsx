import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./components/Auth";
import MapForm from "./components/MapForm";
import MemoriesList from "./components/MemoriesList";

function App() {
    const [user, setUser] = useState<any>(null);
    const [view, setView] = useState<"list" | "add">("list");

    useEffect(() => {
        // Pobierz aktualnego użytkownika przy starcie
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

        // Nasłuchuj zmian w sesji (login/logout)
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
        <div className="min-h-screen bg-gray-100 text-gray-800 px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <div className="flex items-center gap-3">
                        <img src="/icon.png" alt="TrailBack logo" className="h-20 w-20" />
                        {/*<h1 className="text-3xl font-bold text-blue-600">TrailBack</h1>*/}
                    </div>

                    <nav className="flex gap-2">
                        <button
                            onClick={() => setView("list")}
                            className={`nav-link ${view === "list" ? "bg-gray-200" : ""}`}
                        >
                            📖 Lista
                        </button>
                        <button
                            onClick={() => setView("add")}
                            className={`nav-link ${view === "add" ? "bg-gray-200" : ""}`}
                        >
                            ➕ Dodaj
                        </button>
                        <button
                            onClick={handleLogout}
                            className="nav-link text-red-500"
                        >
                            🚪 Wyloguj
                        </button>
                    </nav>
                </header>


                {/* Widok główny */}
                <main className="fade-in">
                    {view === "list" ? <MemoriesList /> : <MapForm />}
                </main>
            </div>
        </div>
    );
}

export default App;
