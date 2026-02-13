/**
 * Item Name Normalization Service
 * Handles multilingual item matching (English ↔ Swahili)
 * and normalizes variations of the same item
 */

// Multilingual dictionary: Swahili ↔ English
const multilingualDictionary = {
  // Vegetables
  nyanya: "tomatoes",
  tomato: "tomatoes",
  tomatoe: "tomatoes",
  vitunguu: "onions",
  onion: "onions",
  karoti: "carrots",
  carrot: "carrots",
  cabichi: "cabbage",
  kabichi: "cabbage",
  sukumawiki: "kale",
  maharagwe: "beans",
  bean: "beans",
  viazi: "potatoes",
  potato: "potatoes",
  muhogo: "cassava",
  cassavas: "cassava",
  pilipili: "pepper",
  peppers: "pepper",

  // Fruits
  embe: "mangoes",
  mango: "mangoes",
  maembe: "mangoes",
  ndizi: "bananas",
  banana: "bananas",
  chungwa: "oranges",
  orange: "oranges",
  machungwa: "oranges",
  parachichi: "avocado",
  avocados: "avocado",
  papai: "papaya",
  papayas: "papaya",
  nanasi: "pineapple",
  pineapples: "pineapple",

  // Grains & Staples
  mahindi: "maize",
  maize: "maize",
  corn: "maize",
  mchele: "rice",
  uchunga: "flour",
  unga: "flour",
  ngano: "wheat",

  // Meat & Protein
  nyama: "meat",
  kuku: "chicken",
  chickens: "chicken",
  samaki: "fish",
  fishes: "fish",
  mayai: "eggs",
  egg: "eggs",

  // Dairy
  maziwa: "milk",
  siagi: "butter",
  jibini: "cheese",

  // Others
  sukari: "sugar",
  chumuvi: "salt",
  mafuta: "oil",
  chai: "tea",
  kahawa: "coffee",
  maji: "water",
  soda: "soda",
  sodas: "soda",

  // Units variations
  kilo: "kg",
  kilogram: "kg",
  kilograms: "kg",
  lita: "liters",
  liter: "liters",
  litre: "liters",
  litres: "liters",
  piece: "pieces",
  pcs: "pieces",
  pc: "pieces",
  bundle: "bundles",
  bag: "bags",
  sack: "sacks",
  crate: "crates",
  gram: "grams",
  gramme: "grams",
  unit: "units",
};

// Common pluralization rules
const pluralRules = [
  { pattern: /ies$/i, replacement: "y" }, // berries -> berry
  { pattern: /ves$/i, replacement: "f" }, // leaves -> leaf
  { pattern: /oes$/i, replacement: "o" }, // tomatoes -> tomato
  { pattern: /ses$/i, replacement: "s" }, // glasses -> glass
  { pattern: /es$/i, replacement: "" }, // oranges -> orange
  { pattern: /s$/i, replacement: "" }, // apples -> apple
];

/**
 * Normalize an item name to its canonical form
 * @param {string} itemName - Raw item name
 * @returns {string} Normalized item name
 */
export const normalizeItemName = (itemName) => {
  if (!itemName || typeof itemName !== "string") return "";

  // Step 1: Clean the name
  let normalized = itemName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, " "); // Normalize spaces

  // Step 2: Check multilingual dictionary (exact match first)
  if (multilingualDictionary[normalized]) {
    return multilingualDictionary[normalized];
  }

  // Step 3: Try to match singular/plural variations
  for (const [key, value] of Object.entries(multilingualDictionary)) {
    if (normalized === key || normalized === value) {
      return value;
    }
  }

  // Step 4: Try removing common prefixes/suffixes
  const withoutThe = normalized.replace(/^the\s+/i, "");
  if (multilingualDictionary[withoutThe]) {
    return multilingualDictionary[withoutThe];
  }

  // Step 5: Try singularizing (if not found in dictionary)
  for (const rule of pluralRules) {
    const singular = normalized.replace(rule.pattern, rule.replacement);
    if (multilingualDictionary[singular]) {
      return multilingualDictionary[singular];
    }
  }

  // Step 6: Return the cleaned name if no match found
  return normalized;
};

/**
 * Find matching inventory item by normalized name
 * @param {string} itemName - Item name to search for
 * @param {Object} Inventory - Mongoose Inventory model
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Matching inventory item or null
 */
export const findInventoryByNormalizedName = async (
  itemName,
  Inventory,
  userId,
) => {
  const normalizedName = normalizeItemName(itemName);

  // Try exact match first
  let item = await Inventory.findOne({
    userId,
    itemName: normalizedName,
  });

  if (item) return item;

  // Try finding by similar normalized names
  const allItems = await Inventory.find({ userId });

  for (const currentItem of allItems) {
    const currentNormalized = normalizeItemName(currentItem.itemName);
    if (currentNormalized === normalizedName) {
      return currentItem;
    }
  }

  // Also check if the raw name matches any stored names
  item = await Inventory.findOne({
    userId,
    itemName: itemName.toLowerCase().trim(),
  });

  return item;
};

/**
 * Batch normalize item names
 * @param {Array<string>} itemNames - Array of item names
 * @returns {Array<string>} Array of normalized names
 */
export const normalizeItemNames = (itemNames) => {
  if (!Array.isArray(itemNames)) return [];
  return itemNames.map(normalizeItemName);
};

/**
 * Get all variations of an item name
 * @param {string} itemName - Item name
 * @returns {Array<string>} Array of possible variations
 */
export const getItemVariations = (itemName) => {
  const normalized = normalizeItemName(itemName);
  const variations = new Set([normalized, itemName.toLowerCase().trim()]);

  // Add dictionary matches
  for (const [key, value] of Object.entries(multilingualDictionary)) {
    if (value === normalized || key === normalized) {
      variations.add(key);
      variations.add(value);
    }
  }

  return Array.from(variations);
};

/**
 * Add new multilingual mapping
 * @param {string} term - Term in any language
 * @param {string} canonical - Canonical form
 */
export const addMultilingualMapping = (term, canonical) => {
  multilingualDictionary[term.toLowerCase().trim()] = canonical
    .toLowerCase()
    .trim();
};
