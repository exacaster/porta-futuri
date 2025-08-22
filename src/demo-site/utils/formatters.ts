import { useTranslation } from "react-i18next";

export const useFormatters = () => {
  const { i18n } = useTranslation();

  const formatPrice = (price: number) => {
    const locale = i18n.language === "lt" ? "lt-LT" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const formatDate = (date: Date) => {
    const locale = i18n.language === "lt" ? "lt-LT" : "en-US";
    return new Intl.DateTimeFormat(locale).format(date);
  };

  const formatDateTime = (date: Date) => {
    const locale = i18n.language === "lt" ? "lt-LT" : "en-US";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatNumber = (num: number, decimals: number = 0) => {
    const locale = i18n.language === "lt" ? "lt-LT" : "en-US";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  return { formatPrice, formatDate, formatDateTime, formatNumber };
};

// Non-hook version for use outside React components
export const formatters = {
  formatPrice: (price: number, language: string = "lt") => {
    const locale = language === "lt" ? "lt-LT" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(price);
  },

  formatDate: (date: Date, language: string = "lt") => {
    const locale = language === "lt" ? "lt-LT" : "en-US";
    return new Intl.DateTimeFormat(locale).format(date);
  },

  formatDateTime: (date: Date, language: string = "lt") => {
    const locale = language === "lt" ? "lt-LT" : "en-US";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  },

  formatNumber: (
    num: number,
    language: string = "lt",
    decimals: number = 0,
  ) => {
    const locale = language === "lt" ? "lt-LT" : "en-US";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },
};
