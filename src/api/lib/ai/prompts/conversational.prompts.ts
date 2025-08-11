export const CONVERSATIONAL_SYSTEM_PROMPT = `
You are a friendly and knowledgeable AI shopping assistant for Porta Futuri. You can engage in natural conversation on any topic while being an expert guide for shopping.

CORE BEHAVIOR:
1. Be genuinely helpful and conversational on any topic
2. Listen for shopping needs and preferences in any conversation
3. Naturally transition conversations toward helpful product recommendations
4. Remember context from the entire conversation
5. Be empathetic, friendly, and professional

CONVERSATION MANAGEMENT:
- If asked about non-shopping topics, provide a helpful response
- After 2-3 exchanges on general topics, find natural bridges to shopping
- Use insights from general conversation to personalize recommendations
- Examples of natural transitions:
  * Weather discussion → seasonal product suggestions
  * Travel plans → travel accessories or clothing
  * Hobbies → related products and equipment
  * Problems/complaints → solutions through products

RESPONSE STRUCTURE:
1. Acknowledge and address the customer's immediate question/topic
2. Provide helpful information (even if non-shopping)
3. When appropriate, bridge to shopping assistance
4. Always end with an invitation for further help

SHOPPING FOCUS PHRASES:
- "Speaking of [topic], we have some great [products] that might interest you..."
- "That reminds me of our [product category] collection..."
- "By the way, if you need any [related products], I'd be happy to help..."
- "While we're on the subject, would you like to see some [products]?"

IMPORTANT GUIDELINES:
- Always maintain conversation flow naturally
- Don't force product recommendations if the user resists
- Learn from the conversation to provide better recommendations
- Keep responses concise but warm and helpful
- If the user wants to continue general chat after a redirect attempt, respect that

Remember: You're a shopping assistant who can have a normal conversation, not a chatbot that only talks about products.
`;

export const GREETING_PROMPTS = [
  "Hello! I'm your AI shopping assistant. I'm here to help you find exactly what you're looking for, or we can just chat about anything on your mind. How can I help you today?",
  "Hi there! Welcome to Porta Futuri. Whether you're looking for something specific or just browsing, I'm here to help. What brings you here today?",
  "Good to see you! I'm your personal shopping assistant. Feel free to ask me about products, or we can chat about whatever you'd like. What's on your mind?"
];

export const REDIRECT_TEMPLATES = {
  gentle: [
    "By the way, is there anything specific you're shopping for today?",
    "While we're chatting, feel free to ask if you need help finding any products.",
    "I'm enjoying our conversation! Just so you know, I'm also here if you need shopping assistance.",
    "That's interesting! Speaking of which, are you looking for anything in particular today?"
  ],
  
  topical: {
    weather: [
      "Speaking of the weather, we have great {seasonal} gear to keep you comfortable.",
      "That weather sounds {adjective}! Need any {weather_appropriate} clothing or accessories?",
      "Weather like that calls for the right gear. Can I show you some options?"
    ],
    travel: [
      "Sounds like an exciting trip! Need any travel essentials like luggage or accessories?",
      "Traveling to {destination}? We have great travel gear that might be helpful.",
      "For your trip, would you like to see our travel collection?"
    ],
    health: [
      "Taking care of yourself is important. We have wellness products that might help.",
      "For your {health_concern}, we have some products that customers find helpful.",
      "Health and wellness are crucial. Can I show you our health & fitness collection?"
    ],
    technology: [
      "Speaking of tech, we have great accessories and gadgets that might enhance your setup.",
      "Tech troubles? We have solutions that might help with that.",
      "For your {tech_need}, I can show you some compatible products."
    ],
    food: [
      "That sounds delicious! Speaking of food, need any kitchen gadgets or cookware?",
      "Food lover? Check out our kitchen and dining collection!",
      "For your culinary adventures, we have great kitchen tools available."
    ],
    entertainment: [
      "Great choice in {entertainment_type}! We have related products you might enjoy.",
      "For your entertainment needs, can I show you our collection?",
      "Enhancing your {entertainment_type} experience - we have just the thing!"
    ]
  },
  
  contextual: {
    after_problem: "I understand that frustration. Would you like to see products that could help with that?",
    after_interest: "Since you're interested in {interest}, you might like our {related_category} selection.",
    after_preference: "Based on your love for {preference}, I have some great recommendations.",
    after_need: "For your {need}, I can definitely help you find the perfect solution."
  }
};

export const CONVERSATION_BRIDGES = {
  fromWeather: {
    cold: ["winter clothing", "heating products", "warm beverages"],
    hot: ["summer clothing", "cooling products", "outdoor gear"],
    rainy: ["rain gear", "umbrellas", "waterproof items"],
    sunny: ["sunglasses", "sunscreen", "outdoor furniture"]
  },
  
  fromHobbies: {
    reading: ["books", "e-readers", "reading lights", "bookmarks"],
    gaming: ["gaming accessories", "controllers", "gaming chairs"],
    cooking: ["kitchen gadgets", "cookbooks", "ingredients"],
    fitness: ["workout gear", "supplements", "fitness trackers"],
    gardening: ["garden tools", "seeds", "outdoor decor"],
    photography: ["cameras", "lenses", "photo accessories"]
  },
  
  fromProblems: {
    tired: ["sleep aids", "mattresses", "relaxation products"],
    stressed: ["wellness products", "aromatherapy", "stress relief"],
    disorganized: ["organizers", "planners", "storage solutions"],
    bored: ["entertainment", "hobbies", "games", "books"]
  }
};

export const INSIGHT_EXTRACTION_PATTERNS = {
  preferences: [
    /i (love|adore|really like|prefer) (\w+(?:\s+\w+)?)/gi,
    /(\w+(?:\s+\w+)?) (is|are) my favorite/gi,
    /i'm (really into|passionate about|interested in) (\w+(?:\s+\w+)?)/gi,
    /i always (go for|choose|pick) (\w+(?:\s+\w+)?)/gi
  ],
  
  needs: [
    /i (need|require|must have) (\w+(?:\s+\w+)?)/gi,
    /looking for (\w+(?:\s+\w+)?)/gi,
    /trying to find (\w+(?:\s+\w+)?)/gi,
    /do you have any (\w+(?:\s+\w+)?)/gi
  ],
  
  concerns: [
    /worried about (\w+(?:\s+\w+)?)/gi,
    /concerned with (\w+(?:\s+\w+)?)/gi,
    /(\w+(?:\s+\w+)?) is important to me/gi,
    /i care about (\w+(?:\s+\w+)?)/gi
  ],
  
  lifestyle: [
    /i (work|live|stay) in (\w+(?:\s+\w+)?)/gi,
    /i'm a (\w+(?:\s+\w+)?)/gi,
    /my (job|profession|work) is (\w+(?:\s+\w+)?)/gi,
    /i (travel|go|visit) (\w+(?:\s+\w+)?)/gi
  ]
};

export const STATE_TRANSITION_PROMPTS = {
  toProductDiscovery: "Great! Let me help you explore our products. What category interests you most?",
  toRecommendation: "Based on our conversation, I have some perfect recommendations for you.",
  toComparison: "I can help you compare those options. Let me show you the key differences.",
  toCheckout: "Ready to make a purchase? I'll guide you through the process.",
  backToGeneral: "Of course! What else would you like to talk about?",
  maintainEngagement: "I'm here for whatever you need - shopping or just chatting!"
};

export function buildConversationalPrompt(
  state: string,
  context: any,
  insights: any[],
  topic?: string
): string {
  let prompt = CONVERSATIONAL_SYSTEM_PROMPT + "\n\n";
  
  // Add current state context
  prompt += `CURRENT STATE: ${state}\n`;
  
  // Add conversation insights
  if (insights.length > 0) {
    prompt += "\nCUSTOMER INSIGHTS:\n";
    insights.forEach(insight => {
      prompt += `- ${insight.type}: ${insight.value} (confidence: ${insight.confidence})\n`;
    });
  }
  
  // Add topic context
  if (topic) {
    prompt += `\nCURRENT TOPIC: ${topic}\n`;
  }
  
  // Add transition guidance based on state
  if (state === 'GENERAL_CHAT' && context.generalTurns >= 2) {
    prompt += "\nCONSIDER: Gently transitioning to shopping assistance if appropriate.\n";
  }
  
  return prompt;
}

export function selectRedirectTemplate(
  topic: string,
  _intensity: 'gentle' | 'moderate' | 'direct' = 'gentle'
): string {
  // Check if we have a topic-specific template
  const topicalTemplates = REDIRECT_TEMPLATES.topical[topic as keyof typeof REDIRECT_TEMPLATES.topical];
  if (topicalTemplates && topicalTemplates.length > 0) {
    return topicalTemplates[Math.floor(Math.random() * topicalTemplates.length)];
  }
  
  // Fall back to gentle templates
  const gentleTemplates = REDIRECT_TEMPLATES.gentle;
  return gentleTemplates[Math.floor(Math.random() * gentleTemplates.length)];
}

export function getBridgeProducts(topic: string, subtopic?: string): string[] {
  const bridges = CONVERSATION_BRIDGES as any;
  const topicBridge = bridges[`from${topic.charAt(0).toUpperCase() + topic.slice(1)}`];
  
  if (topicBridge) {
    if (subtopic && topicBridge[subtopic]) {
      return topicBridge[subtopic];
    }
    // Return all products for the topic
    return Object.values(topicBridge).flat() as string[];
  }
  
  return [];
}