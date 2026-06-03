/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}", // ← au cas où tu as encore un dossier `pages`
    "./src/**/*.{js,ts,jsx,tsx}", // ← au cas où tu as déplacé des fichiers dans `src`
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8E7AB5",
        secondary: "#F5F3F7",
        dark: "#1C1C1C",
        muted: "#5E5E5E",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"), // ← Optionnel mais recommandé
    require("@tailwindcss/typography"), // ← Pour le style des textes/actualités/blog
    require("@tailwindcss/aspect-ratio"), // ← Pour gérer les images/vidéos responsive
  ],
};
