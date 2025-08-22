import { useState, useEffect, useCallback } from "react";
import { translations } from "../services/i18n/translations";

export type Language = "lt" | "en";

export const useLanguage = () => {
  // Initialize language based on priority order
  const [language, setLanguage] = useState<Language>(() => {
    // 1. Check document lang attribute
    const docLang = document.documentElement.lang?.toLowerCase();
    if (docLang?.startsWith("lt")) {
      return "lt";
    }
    if (docLang?.startsWith("en")) {
      return "en";
    }

    // 2. Check navigator language
    const navLang = navigator.language?.toLowerCase();
    if (navLang?.startsWith("lt")) {
      return "lt";
    }
    if (navLang?.startsWith("en")) {
      return "en";
    }

    // 3. Default to Lithuanian
    return "lt";
  });

  // Translation function that supports nested keys
  const t = useCallback(
    (key: string): string => {
      try {
        const keys = key.split(".");
        let value: any = translations[language];

        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k];
          } else {
            console.warn(`Translation key not found: ${key}`);
            return key;
          }
        }

        // If we have an array of strings (for greetings), return a random one
        if (Array.isArray(value)) {
          return value[Math.floor(Math.random() * value.length)];
        }

        return typeof value === "string" ? value : key;
      } catch (error) {
        console.error(`Error getting translation for key: ${key}`, error);
        return key;
      }
    },
    [language],
  );

  // Listen for changes to document language
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "lang"
        ) {
          const newLang = document.documentElement.lang?.toLowerCase();
          if (newLang?.startsWith("lt")) {
            setLanguage("lt");
          } else if (newLang?.startsWith("en")) {
            setLanguage("en");
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, []);

  return { language, t, setLanguage };
};
