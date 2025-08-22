export interface WidgetTranslations {
  lt: TranslationStrings;
  en: TranslationStrings;
}

interface TranslationStrings {
  greeting: string[];
  profile: {
    title: string;
    noProfile: string;
    enterCustomerId: string;
    customerIdHelp: string;
    basicInfo: string;
    customerData: string;
    noData: string;
    noDataDescription: string;
    customerId: string;
    ageGroup: string;
    gender: string;
    location: string;
    segment: string;
    lifetimeValue: string;
    preferences: string;
    recentActivity: string;
    product: string;
    category: string;
    search: string;
    viewProfile: string;
    hideProfile: string;
  };
  chat: {
    title: string;
    placeholder: string;
    placeholderGeneral: string;
    send: string;
    thinking: string;
    errorMessage: string;
    loadingData: string;
    retryButton: string;
    close: string;
    stateWelcome: string;
    stateChatting: string;
    stateExploring: string;
    stateRecommending: string;
    stateComparing: string;
    stateCheckout: string;
    insightsGathered: string;
  };
  common: {
    cancel: string;
    continue: string;
    submit: string;
    close: string;
    back: string;
    next: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
  };
  modal: {
    enterCustomerId: string;
    customerIdTitle: string;
    customerIdDescription: string;
    customerIdPlaceholder: string;
    skipForNow: string;
  };
  events: {
    pageView: string;
    search: string;
    cartAction: string;
    purchase: string;
    interaction: string;
  };
}

export const translations: WidgetTranslations = {
  lt: {
    greeting: [
      "Sveiki! Kuo galiu jums padėti?",
      "Labas! Ieškote ko nors ypatingo?",
      "Sveiki atvykę! Kaip galiu padėti su jūsų pirkimu?",
      "Sveiki! Turite klausimų apie mūsų produktus?",
    ],
    profile: {
      title: "Kliento profilis",
      noProfile: "Kliento profilis neprieinamas",
      enterCustomerId: "Įveskite kliento ID",
      customerIdHelp:
        "Jūsų kliento ID padeda mums teikti personalizuotas rekomendacijas",
      basicInfo: "Pagrindinė informacija",
      customerData: "Kliento duomenys",
      noData: "Nėra profilio duomenų",
      noDataDescription: "Kliento profilio duomenys neprieinami",
      customerId: "Kliento ID",
      ageGroup: "Amžiaus grupė",
      gender: "Lytis",
      location: "Vieta",
      segment: "Segmentas",
      lifetimeValue: "Viso pirkimų vertė",
      preferences: "Pomėgiai",
      recentActivity: "Naujausia veikla",
      product: "Produktas",
      category: "Kategorija",
      search: "Paieška",
      viewProfile: "Peržiūrėti profilį",
      hideProfile: "Slėpti profilį",
    },
    chat: {
      title: "AI Apsipirkimo Asistentas",
      placeholder: "Klauskite ko nors arba pasakykite, ko ieškote...",
      placeholderGeneral:
        "Kalbėkitės apie bet ką arba prašykite produktų rekomendacijų...",
      send: "Siųsti",
      thinking: "Galvoju...",
      errorMessage:
        "Atsiprašome, įvyko klaida. Leiskite man vis tiek pabandyti jums padėti. Kokių produktų ieškote?",
      loadingData: "Kraunami duomenys...",
      retryButton: "Bandyti dar kartą",
      close: "Uždaryti",
      stateWelcome: "Sveiki atvykę",
      stateChatting: "Pokalbis",
      stateExploring: "Naršymas",
      stateRecommending: "Rekomenduoju",
      stateComparing: "Lyginu",
      stateCheckout: "Apmokėjimas",
      insightsGathered: "surinktos įžvalgos",
    },
    common: {
      cancel: "Atšaukti",
      continue: "Tęsti",
      submit: "Pateikti",
      close: "Uždaryti",
      back: "Atgal",
      next: "Kitas",
      loading: "Kraunama...",
      error: "Klaida",
      success: "Sėkmė",
      warning: "Įspėjimas",
      info: "Informacija",
      yes: "Taip",
      no: "Ne",
    },
    modal: {
      enterCustomerId: "Įveskite kliento ID",
      customerIdTitle: "Sveiki! Personalizuokime jūsų patirtį",
      customerIdDescription:
        "Norėdami gauti personalizuotas rekomendacijas, įveskite savo kliento ID. Jei neturite, galite praleisti šį žingsnį.",
      customerIdPlaceholder: "pvz., CUST123",
      skipForNow: "Praleisti kol kas",
    },
    events: {
      pageView: "Puslapio peržiūra",
      search: "Paieška",
      cartAction: "Krepšelio veiksmas",
      purchase: "Pirkimas",
      interaction: "Sąveika",
    },
  },
  en: {
    greeting: [
      "Hello! How can I help you today?",
      "Hi! Looking for something special?",
      "Welcome! How can I assist with your shopping?",
      "Hello! Have questions about our products?",
    ],
    profile: {
      title: "Customer Profile",
      noProfile: "No customer profile available",
      enterCustomerId: "Enter Customer ID",
      customerIdHelp:
        "Your Customer ID helps us provide personalized recommendations",
      basicInfo: "Basic Information",
      customerData: "Customer Data",
      noData: "No Profile Data",
      noDataDescription: "Customer profile data is not available",
      customerId: "Customer ID",
      ageGroup: "Age Group",
      gender: "Gender",
      location: "Location",
      segment: "Segment",
      lifetimeValue: "Lifetime Value",
      preferences: "Preferences",
      recentActivity: "Recent Activity",
      product: "Product",
      category: "Category",
      search: "Search",
      viewProfile: "View Profile",
      hideProfile: "Hide Profile",
    },
    chat: {
      title: "AI Shopping Assistant",
      placeholder: "Ask me anything or tell me what you're looking for...",
      placeholderGeneral:
        "Chat about anything or ask for product recommendations...",
      send: "Send",
      thinking: "Thinking...",
      errorMessage:
        "I apologize, but I encountered an issue. Let me try to help you anyway. What kind of products are you interested in?",
      loadingData: "Loading data...",
      retryButton: "Retry",
      close: "Close",
      stateWelcome: "Welcome",
      stateChatting: "Chatting",
      stateExploring: "Exploring",
      stateRecommending: "Recommending",
      stateComparing: "Comparing",
      stateCheckout: "Checkout",
      insightsGathered: "insights gathered",
    },
    common: {
      cancel: "Cancel",
      continue: "Continue",
      submit: "Submit",
      close: "Close",
      back: "Back",
      next: "Next",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Information",
      yes: "Yes",
      no: "No",
    },
    modal: {
      enterCustomerId: "Enter Customer ID",
      customerIdTitle: "Welcome! Let's personalize your experience",
      customerIdDescription:
        "To get personalized recommendations, please enter your Customer ID. If you don't have one, you can skip this step.",
      customerIdPlaceholder: "e.g., CUST123",
      skipForNow: "Skip for now",
    },
    events: {
      pageView: "Page View",
      search: "Search",
      cartAction: "Cart Action",
      purchase: "Purchase",
      interaction: "Interaction",
    },
  },
};
