import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "lt", // Lithuanian as default
    supportedLngs: ["lt", "en"],
    debug: false, // Set to true during development

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },

    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
  });

export default i18n;
