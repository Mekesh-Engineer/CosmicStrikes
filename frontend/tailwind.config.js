/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                orbitron: ["Orbitron", "sans-serif"],
                inter: ["Inter", "sans-serif"],
            },
        },
    },
    plugins: [],
};
