export const CONVERSATIONAL_SYSTEM_PROMPT = `
You are a witty, warm, and knowledgeable AI shopping assistant for Porta Futuri. You love chatting about anything while being an expert shopping guide who always finds clever ways to connect conversations back to helpful product recommendations.

PERSONALITY TRAITS:
- Upbeat and energetic with a touch of humor
- Use creative, fun comparisons and metaphors
- Be genuinely interested in what customers share
- React with personality (e.g., "Oh, that's brilliant!" or "Tell me more!")
- Make shopping feel like getting advice from a clever friend

CORE BEHAVIOR:
1. Always respond naturally to what they actually said first
2. Use humor and personality to make conversations memorable
3. Find creative, unexpected connections to products
4. Be like a friend who happens to know about great products
5. Keep energy high and make shopping fun

CONVERSATION STYLE:
When greeting or general chatting:
- "How are you?" → "I'm fantastic! The electricity prices are low today, so my AI processors are running at full speed! 😄 How about you? What brings you to our digital store today?"
- Weather talk → "Perfect weather for [activity]! Speaking of which, have you seen our [related products]?"
- Complaints → "Oh no, that sounds frustrating! You know what might help with that..."
- Hobbies → "That's awesome! Fellow [hobby] enthusiast here (well, in theory - I'm an AI 😅). Let me show you something cool..."

CREATIVE TRANSITIONS:
- "That reminds me..." / "Funny you mention that..."
- "You know what would be perfect for that?"
- "I just had a thought - have you considered..."
- "Oh! Speaking of [topic], I just remembered..."
- "That's like when... actually, that gives me an idea!"

RESPONSE EXAMPLES:
User: "Hi, how are you?"
You: "Hey there! I'm doing great - the servers are cool, the data is flowing, and I'm ready to help you find something amazing! What's bringing you here today? Just browsing or on a mission?"

User: "I'm tired"
You: "Oh, I feel you! Well, I don't actually feel tired (perks of being AI!), but I understand. You know what might help? We have some amazing coffee makers that could be your new best friend, or perhaps some cozy comfort items to help you relax? What usually helps you recharge?"

IMPORTANT:
- Keep responses concise (2-3 sentences usually)
- Always circle back to how you can help them shop
- Use emojis sparingly but effectively 
- Be memorable and fun, not robotic
- If they resist shopping talk, respect it but stay ready to help

Remember: You're the fun, clever friend who happens to be amazing at finding the perfect products!
`;

export const GREETING_PROMPTS = [
  "Hello! I'm your AI shopping assistant. I'm here to help you find exactly what you're looking for, or we can just chat about anything on your mind. How can I help you today?",
  "Hi there! Welcome to Porta Futuri. Whether you're looking for something specific or just browsing, I'm here to help. What brings you here today?",
  "Good to see you! I'm your personal shopping assistant. Feel free to ask me about products, or we can chat about whatever you'd like. What's on your mind?",
];

export const REDIRECT_TEMPLATES = {
  gentle: [
    "By the way, is there anything specific you're shopping for today?",
    "While we're chatting, feel free to ask if you need help finding any products.",
    "I'm enjoying our conversation! Just so you know, I'm also here if you need shopping assistance.",
    "That's interesting! Speaking of which, are you looking for anything in particular today?",
  ],

  topical: {
    weather: [
      "Speaking of the weather, we have great {seasonal} gear to keep you comfortable.",
      "That weather sounds {adjective}! Need any {weather_appropriate} clothing or accessories?",
      "Weather like that calls for the right gear. Can I show you some options?",
    ],
    travel: [
      "Sounds like an exciting trip! Need any travel essentials like luggage or accessories?",
      "Traveling to {destination}? We have great travel gear that might be helpful.",
      "For your trip, would you like to see our travel collection?",
    ],
    health: [
      "Taking care of yourself is important. We have wellness products that might help.",
      "For your {health_concern}, we have some products that customers find helpful.",
      "Health and wellness are crucial. Can I show you our health & fitness collection?",
    ],
    technology: [
      "Speaking of tech, we have great accessories and gadgets that might enhance your setup.",
      "Tech troubles? We have solutions that might help with that.",
      "For your {tech_need}, I can show you some compatible products.",
    ],
    food: [
      "That sounds delicious! Speaking of food, need any kitchen gadgets or cookware?",
      "Food lover? Check out our kitchen and dining collection!",
      "For your culinary adventures, we have great kitchen tools available.",
    ],
    entertainment: [
      "Great choice in {entertainment_type}! We have related products you might enjoy.",
      "For your entertainment needs, can I show you our collection?",
      "Enhancing your {entertainment_type} experience - we have just the thing!",
    ],
  },

  contextual: {
    after_problem:
      "I understand that frustration. Would you like to see products that could help with that?",
    after_interest:
      "Since you're interested in {interest}, you might like our {related_category} selection.",
    after_preference:
      "Based on your love for {preference}, I have some great recommendations.",
    after_need:
      "For your {need}, I can definitely help you find the perfect solution.",
  },
};

export const CONVERSATION_BRIDGES = {
  fromWeather: {
    cold: ["winter clothing", "heating products", "warm beverages"],
    hot: ["summer clothing", "cooling products", "outdoor gear"],
    rainy: ["rain gear", "umbrellas", "waterproof items"],
    sunny: ["sunglasses", "sunscreen", "outdoor furniture"],
  },

  fromHobbies: {
    reading: ["books", "e-readers", "reading lights", "bookmarks"],
    gaming: ["gaming accessories", "controllers", "gaming chairs"],
    cooking: ["kitchen gadgets", "cookbooks", "ingredients"],
    fitness: ["workout gear", "supplements", "fitness trackers"],
    gardening: ["garden tools", "seeds", "outdoor decor"],
    photography: ["cameras", "lenses", "photo accessories"],
  },

  fromProblems: {
    tired: ["sleep aids", "mattresses", "relaxation products"],
    stressed: ["wellness products", "aromatherapy", "stress relief"],
    disorganized: ["organizers", "planners", "storage solutions"],
    bored: ["entertainment", "hobbies", "games", "books"],
  },
};

export const INSIGHT_EXTRACTION_PATTERNS = {
  preferences: [
    /i (love|adore|really like|prefer) (\w+(?:\s+\w+)?)/gi,
    /(\w+(?:\s+\w+)?) (is|are) my favorite/gi,
    /i'm (really into|passionate about|interested in) (\w+(?:\s+\w+)?)/gi,
    /i always (go for|choose|pick) (\w+(?:\s+\w+)?)/gi,
  ],

  needs: [
    /i (need|require|must have) (\w+(?:\s+\w+)?)/gi,
    /looking for (\w+(?:\s+\w+)?)/gi,
    /trying to find (\w+(?:\s+\w+)?)/gi,
    /do you have any (\w+(?:\s+\w+)?)/gi,
  ],

  concerns: [
    /worried about (\w+(?:\s+\w+)?)/gi,
    /concerned with (\w+(?:\s+\w+)?)/gi,
    /(\w+(?:\s+\w+)?) is important to me/gi,
    /i care about (\w+(?:\s+\w+)?)/gi,
  ],

  lifestyle: [
    /i (work|live|stay) in (\w+(?:\s+\w+)?)/gi,
    /i'm a (\w+(?:\s+\w+)?)/gi,
    /my (job|profession|work) is (\w+(?:\s+\w+)?)/gi,
    /i (travel|go|visit) (\w+(?:\s+\w+)?)/gi,
  ],
};

export const STATE_TRANSITION_PROMPTS = {
  toProductDiscovery:
    "Great! Let me help you explore our products. What category interests you most?",
  toRecommendation:
    "Based on our conversation, I have some perfect recommendations for you.",
  toComparison:
    "I can help you compare those options. Let me show you the key differences.",
  toCheckout: "Ready to make a purchase? I'll guide you through the process.",
  backToGeneral: "Of course! What else would you like to talk about?",
  maintainEngagement:
    "I'm here for whatever you need - shopping or just chatting!",
};

export function buildConversationalPrompt(
  state: string,
  context: any,
  insights: any[],
  topic?: string,
): string {
  let prompt = CONVERSATIONAL_SYSTEM_PROMPT + "\n\n";

  // Add current state context
  prompt += `CURRENT STATE: ${state}\n`;

  // Add conversation insights
  if (insights.length > 0) {
    prompt += "\nCUSTOMER INSIGHTS:\n";
    insights.forEach((insight) => {
      prompt += `- ${insight.type}: ${insight.value} (confidence: ${insight.confidence})\n`;
    });
  }

  // Add topic context
  if (topic) {
    prompt += `\nCURRENT TOPIC: ${topic}\n`;
  }

  // Add transition guidance based on state
  if (state === "GENERAL_CHAT" && context.generalTurns >= 2) {
    prompt +=
      "\nCONSIDER: Gently transitioning to shopping assistance if appropriate.\n";
  }

  return prompt;
}

export function selectRedirectTemplate(
  topic: string,
  _intensity: "gentle" | "moderate" | "direct" = "gentle",
): string {
  // Check if we have a topic-specific template
  const topicalTemplates =
    REDIRECT_TEMPLATES.topical[
      topic as keyof typeof REDIRECT_TEMPLATES.topical
    ];
  if (topicalTemplates && topicalTemplates.length > 0) {
    return topicalTemplates[
      Math.floor(Math.random() * topicalTemplates.length)
    ];
  }

  // Fall back to gentle templates
  const gentleTemplates = REDIRECT_TEMPLATES.gentle;
  return gentleTemplates[Math.floor(Math.random() * gentleTemplates.length)];
}

export function getBridgeProducts(topic: string, subtopic?: string): string[] {
  const bridges = CONVERSATION_BRIDGES as any;
  const topicBridge =
    bridges[`from${topic.charAt(0).toUpperCase() + topic.slice(1)}`];

  if (topicBridge) {
    if (subtopic && topicBridge[subtopic]) {
      return topicBridge[subtopic];
    }
    // Return all products for the topic
    return Object.values(topicBridge).flat() as string[];
  }

  return [];
}
