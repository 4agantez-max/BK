/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#7FD6E3",
        lagoon: "#1F9BB8",
        denim: "#3F62A0",
        deep: "#123F66",
        paper: "#E9EDF0",
        foam: "#FFFFFF",
        ink: "#0A0A0A",
      },
      boxShadow: {
        card: "0 8px 24px rgba(18, 63, 102, 0.25)",
      },
    },
  },
  plugins: [],
};
