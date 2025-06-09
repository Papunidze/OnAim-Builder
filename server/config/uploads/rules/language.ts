import SetLanguage from "language-management-lib";

const lngObject = {
  en: { title: "Rules" },
  es: { title: "Reglas" },
};

export type LngProps = typeof lngObject.en;
export const lng = new SetLanguage(lngObject, "en");
