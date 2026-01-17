/**
 * Keyword Extraction Service
 */

const KEYWORD_PATTERNS = {
  sales: {
    keywords: [
      "sale",
      "sales",
      "sold",
      "revenue",
      "income",
      "earning",
      "bought",
    ],
    category: "sales",
  },
  expenses: {
    keywords: [
      "expense",
      "expenses",
      "cost",
      "spent",
      "payment",
      "paid",
      "bill",
      "purchase",
    ],
    category: "expenses",
  },
  debt: {
    keywords: [
      "debt",
      "owe",
      "owes",
      "credit",
      "loan",
      "borrow",
      "lend",
      "due",
    ],
    category: "debt",
  },
  customer: {
    keywords: ["customer", "client", "buyer", "patron"],
    category: "customer",
  },
  inventory: {
    keywords: ["stock", "inventory", "item", "product", "goods"],
    category: "inventory",
  },
};

const TIME_PATTERNS = {
  today: ["today", "now"],
  yesterday: ["yesterday"],
  week: ["week", "this week", "last week"],
  month: ["month", "this month", "last month"],
};

const ACTION_PATTERNS = {
  create: ["add", "create", "new", "record", "made", "got"],
  read: ["show", "get", "view", "display", "list", "see"],
  update: ["update", "change", "modify"],
  delete: ["delete", "remove", "cancel"],
};

export function extractKeywords(text) {
  const lowerText = text.toLowerCase();
  const extracted = {
    categories: [],
    timeframe: null,
    action: null,
    amounts: [],
    names: [],
  };

  // Extract categories
  for (const [key, pattern] of Object.entries(KEYWORD_PATTERNS)) {
    if (pattern.keywords.some((kw) => lowerText.includes(kw))) {
      extracted.categories.push(pattern.category);
    }
  }

  // Extract timeframe
  for (const [timeframe, patterns] of Object.entries(TIME_PATTERNS)) {
    if (patterns.some((p) => lowerText.includes(p))) {
      extracted.timeframe = timeframe;
      break;
    }
  }

  // Extract action
  for (const [action, patterns] of Object.entries(ACTION_PATTERNS)) {
    if (patterns.some((p) => lowerText.includes(p))) {
      extracted.action = action;
      break;
    }
  }

  // Extract amounts
  const amountRegex = /(?:ksh|kes|\$)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi;
  const amounts = text.match(amountRegex);
  if (amounts) {
    extracted.amounts = amounts
      .map((a) => parseFloat(a.replace(/[^\d.]/g, "")))
      .filter(Boolean);
  }

  // Extract names (capitalized words)
  const nameRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
  const names = text.match(nameRegex);
  if (names) {
    const exclude = [
      "I",
      "Today",
      "Yesterday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    extracted.names = names.filter((n) => !exclude.includes(n));
  }

  return extracted;
}
