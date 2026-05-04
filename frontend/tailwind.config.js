/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: { glass: "0 10px 30px rgba(0,0,0,0.35)" }
    }
  },
  plugins: []
};
