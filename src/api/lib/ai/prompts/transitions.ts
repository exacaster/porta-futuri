interface TransitionTemplate {
  trigger: string[];
  transition: string;
  products?: string[];
  confidence: number;
}

export const TRANSITION_TEMPLATES: Record<string, TransitionTemplate> = {
  weather: {
    trigger: [
      "weather",
      "cold",
      "hot",
      "rain",
      "snow",
      "sunny",
      "cloudy",
      "storm",
      "windy",
    ],
    transition:
      "Speaking of the weather, we have great {seasonal_category} to keep you {comfort_word}. Would you like to see some options?",
    products: [
      "jackets",
      "umbrellas",
      "boots",
      "scarves",
      "sunglasses",
      "hats",
    ],
    confidence: 0.85,
  },

  travel: {
    trigger: [
      "trip",
      "vacation",
      "travel",
      "flight",
      "hotel",
      "journey",
      "visit",
      "tourist",
    ],
    transition:
      "Sounds like an exciting trip! Need any travel essentials like luggage, adapters, or comfort items?",
    products: [
      "luggage",
      "travel adapters",
      "neck pillows",
      "toiletry bags",
      "backpacks",
    ],
    confidence: 0.9,
  },

  health: {
    trigger: [
      "tired",
      "stress",
      "workout",
      "diet",
      "sleep",
      "exercise",
      "fitness",
      "wellness",
    ],
    transition:
      "Taking care of yourself is important. We have wellness products that might help with that.",
    products: [
      "supplements",
      "fitness equipment",
      "yoga mats",
      "health monitors",
      "massage tools",
    ],
    confidence: 0.8,
  },

  technology: {
    trigger: [
      "computer",
      "phone",
      "internet",
      "app",
      "software",
      "laptop",
      "tablet",
      "device",
    ],
    transition:
      "Speaking of tech, we have great accessories and gadgets that might enhance your setup.",
    products: [
      "phone cases",
      "chargers",
      "keyboards",
      "mice",
      "cables",
      "stands",
    ],
    confidence: 0.85,
  },

  home: {
    trigger: [
      "house",
      "home",
      "apartment",
      "room",
      "furniture",
      "decor",
      "moving",
      "renovation",
    ],
    transition:
      "For your home, we have a wonderful selection of furniture and decor items that might interest you.",
    products: [
      "furniture",
      "lighting",
      "rugs",
      "curtains",
      "decorations",
      "organizers",
    ],
    confidence: 0.8,
  },

  food: {
    trigger: [
      "cooking",
      "eating",
      "recipe",
      "kitchen",
      "meal",
      "food",
      "restaurant",
      "chef",
    ],
    transition:
      "Food lovers unite! Check out our kitchen gadgets and cookware collection.",
    products: [
      "cookware",
      "utensils",
      "appliances",
      "storage",
      "cutting boards",
    ],
    confidence: 0.85,
  },

  entertainment: {
    trigger: [
      "movie",
      "music",
      "game",
      "book",
      "show",
      "concert",
      "hobby",
      "fun",
    ],
    transition:
      "For your entertainment needs, we have products that can enhance your experience.",
    products: ["speakers", "headphones", "games", "books", "streaming devices"],
    confidence: 0.75,
  },

  work: {
    trigger: [
      "job",
      "office",
      "work",
      "career",
      "business",
      "meeting",
      "project",
      "deadline",
    ],
    transition:
      "For your work life, we have office supplies and productivity tools that might help.",
    products: [
      "desk accessories",
      "notebooks",
      "pens",
      "organizers",
      "office chairs",
    ],
    confidence: 0.8,
  },

  fashion: {
    trigger: [
      "clothes",
      "outfit",
      "style",
      "fashion",
      "wear",
      "dress",
      "look",
      "trend",
    ],
    transition:
      "Fashion is a great way to express yourself! Would you like to see our latest collections?",
    products: ["clothing", "shoes", "accessories", "bags", "jewelry"],
    confidence: 0.9,
  },

  sports: {
    trigger: [
      "sport",
      "team",
      "game",
      "player",
      "match",
      "training",
      "athlete",
      "competition",
    ],
    transition:
      "Athletes need the right gear! Check out our sports equipment and apparel.",
    products: [
      "sports equipment",
      "athletic wear",
      "shoes",
      "accessories",
      "supplements",
    ],
    confidence: 0.85,
  },

  pets: {
    trigger: ["dog", "cat", "pet", "animal", "puppy", "kitten", "bird", "fish"],
    transition:
      "Pet parents love our selection of pet supplies and accessories!",
    products: ["pet food", "toys", "beds", "collars", "grooming supplies"],
    confidence: 0.9,
  },

  beauty: {
    trigger: [
      "makeup",
      "skincare",
      "beauty",
      "cosmetics",
      "hair",
      "perfume",
      "grooming",
    ],
    transition:
      "Beauty and self-care are important! Would you like to explore our beauty collection?",
    products: ["skincare", "makeup", "hair care", "fragrances", "tools"],
    confidence: 0.85,
  },

  general: {
    trigger: [],
    transition:
      "That's interesting! By the way, is there anything you're shopping for today that I can help with?",
    products: [],
    confidence: 0.6,
  },
};

export function findBestTransition(message: string): TransitionTemplate | null {
  const lowerMessage = message.toLowerCase();
  let bestMatch: TransitionTemplate | null = null;
  let highestScore = 0;

  for (const [topic, template] of Object.entries(TRANSITION_TEMPLATES)) {
    if (topic === "general") {
      continue;
    }

    const matchCount = template.trigger.filter((trigger) =>
      lowerMessage.includes(trigger),
    ).length;

    const score = matchCount * template.confidence;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = template;
    }
  }

  // If no specific match, use general template
  if (!bestMatch || highestScore < 0.5) {
    bestMatch = TRANSITION_TEMPLATES.general;
  }

  return bestMatch;
}

export function personalizeTransition(
  template: string,
  context: {
    topic?: string;
    category?: string;
    season?: string;
    mood?: string;
  },
): string {
  let personalizedTemplate = template;

  // Replace placeholders with context-specific values
  if (context.category) {
    personalizedTemplate = personalizedTemplate.replace(
      "{category}",
      context.category,
    );
    personalizedTemplate = personalizedTemplate.replace(
      "{seasonal_category}",
      `${context.season || ""} ${context.category}`.trim(),
    );
  }

  if (context.mood === "cold") {
    personalizedTemplate = personalizedTemplate.replace(
      "{comfort_word}",
      "warm and cozy",
    );
  } else if (context.mood === "hot") {
    personalizedTemplate = personalizedTemplate.replace(
      "{comfort_word}",
      "cool and comfortable",
    );
  }

  // Remove any remaining placeholders
  personalizedTemplate = personalizedTemplate.replace(/\{[^}]+\}/g, "products");

  return personalizedTemplate;
}

export const CONVERSATION_CONTINUITY_PHRASES = [
  "Going back to what you mentioned about {previous_topic}...",
  "Earlier you said something about {previous_topic} - ",
  "Returning to our {previous_topic} discussion - ",
  "As we were discussing {previous_topic} - ",
  "You mentioned {previous_topic} before - ",
];

export const ACKNOWLEDGMENT_PHRASES = {
  positive: [
    "That's wonderful!",
    "How exciting!",
    "That sounds great!",
    "Fantastic!",
    "That's awesome!",
  ],

  neutral: [
    "I understand.",
    "I see what you mean.",
    "That makes sense.",
    "Got it.",
    "Thanks for sharing that.",
  ],

  empathetic: [
    "I can understand how that feels.",
    "That must be challenging.",
    "I hear you.",
    "That's a valid concern.",
    "I appreciate you sharing that.",
  ],
};

export function selectAcknowledgment(
  sentiment: "positive" | "neutral" | "negative",
): string {
  const phrases =
    sentiment === "positive"
      ? ACKNOWLEDGMENT_PHRASES.positive
      : sentiment === "negative"
        ? ACKNOWLEDGMENT_PHRASES.empathetic
        : ACKNOWLEDGMENT_PHRASES.neutral;

  return phrases[Math.floor(Math.random() * phrases.length)];
}

export const SHOPPING_INTENT_SIGNALS = [
  "I'm looking for",
  "I need",
  "I want to buy",
  "Do you have",
  "Can you recommend",
  "What's the best",
  "I'm shopping for",
  "Show me",
  "I'm interested in",
  "Where can I find",
];

export function hasShoppingIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return SHOPPING_INTENT_SIGNALS.some((signal) =>
    lowerMessage.includes(signal.toLowerCase()),
  );
}
