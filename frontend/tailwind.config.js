// tailwind.config.js
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // ← MUSI zawierać odpowiednie ścieżki
    ],
    theme: {
        extend: {}, // możesz też zdefiniować własne kolory
    },
    plugins: [], // ← może zostać puste
};
