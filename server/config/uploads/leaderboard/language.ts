import SetLanguage from "language-management-lib";

const lngObject = {
  en: {
    title: "Leaderboard",
    rank: "Rank",
    player: "Player",
    score: "Score",
    prize: "Prize",
    loading: "Loading leaderboard...",
    error: "Error",
    unknownError: "An unknown error occurred.",
    errorFetchingData: "Failed to retrieve initial leaderboard configuration.",
    noDataAlt: "No data found",
  },
  es: {
    title: "Tabla de Clasificación",
    rank: "Rango",
    player: "Jugador",
    score: "Puntuación",
    prize: "Premio",
    loading: "Cargando tabla...",
    error: "Error",
    unknownError: "Ocurrió un error desconocido.",
    errorFetchingData: "Error al recuperar la configuración de la tabla.",
    noDataAlt: "No se encontraron datos",
  },
};

export type LngProps = typeof lngObject.en;
export const lng = new SetLanguage(lngObject, "en");
