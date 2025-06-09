import SetLanguage from "language-management-lib";

const lngObject = {
  en: {
    title: "Leaderboard",
    noPlayers: "No players yet!",
  },
  es: {
    title: "Tabla de clasificación",
    noPlayers: "¡No hay jugadores aún!",
  },
};

export type LngProps = typeof lngObject.en;
export const lng = new SetLanguage(lngObject, "en");
