/**
 * Advanced Transaction Extraction Service
 * Extracts structured transaction data from natural language
 */

import { getLLMResponse } from './llmService.js';

/**
 * Extract structured transaction data from user message
 * @param {string} userMessage - Natural language input
 * @param {string} language - Detected language (en, sw)
 * @returns {Promise<Object>} Extracted transaction data
 */
export async function extractTransactionData(userMessage, language = 'en') {
  const systemPrompt = buildExtractionPrompt(language);
  
  try {
    const response = await getLLMResponse(userMessage, systemPrompt, []);
    
    // Parse the JSON response from LLM
    const jsonMatch = response.reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback to regex-based extraction
      return fallbackExtraction(userMessage);
    }
    
    const extracted = JSON.parse(jsonMatch[0]);
    return validateAndNormalize(extracted);
    
  } catch (error) {
    console.error('LLM extraction failed, using fallback:', error);
    return fallbackExtraction(userMessage);
  }
}

/**
 * Build extraction prompt based on language
 */
function buildExtractionPrompt(language) {
  const basePrompt = `You are a transaction data extractor for a bookkeeping system.
Extract structured data from the user's message and return ONLY a JSON object.

Extract:
1. transactionType: "sale", "purchase", "expense", or "debt"
2. items: array of { name, quantity, unit, unitPrice }
3. totalAmount: total transaction amount
4. customerName: customer name if mentioned
5. date: date if mentioned (format: YYYY-MM-DD) or null for today
6. notes: any additional context
7. paymentStatus: "paid" or "unpaid" (default to "paid" for sales/expenses, "unpaid" for debt/loans)

Example Input: "I sold 5kg tomatoes for 500 shillings to John"
Example Output:
{
  "transactionType": "sale",
  "items": [
    {
      "name": "tomatoes",
      "quantity": 5,
      "unit": "kg",
      "unitPrice": 100
    }
  ],
  "totalAmount": 500,
  "customerName": "John",
  "date": null,
  "notes": null,
  "paymentStatus": "paid"
}`;

  const swahiliAddition = language === 'sw' ? `

Note: Input may be in Kiswahili. Common words:
- "nimeuza" = sold, "nilinunua" = bought
- "kilo" = kg, "shilingi" = shillings
- "nyanya" = tomatoes, "vitunguu" = onions
- "leo" = today, "jana" = yesterday` : '';

  return basePrompt + swahiliAddition + '\n\nReturn ONLY the JSON object, no explanation.';
}

/**
 * Validate and normalize extracted data
 */
function validateAndNormalize(data) {
  const normalized = {
    transactionType: data.transactionType || 'sale',
    items: [],
    totalAmount: parseFloat(data.totalAmount) || 0,
    customerName: data.customerName || null,
    date: data.date || null,
    notes: data.notes || null,
    paymentStatus: data.paymentStatus || null,
    confidence: 'high'
  };

  // Normalize items
  if (Array.isArray(data.items) && data.items.length > 0) {
    normalized.items = data.items.map(item => ({
      name: (item.name || '').toLowerCase().trim(),
      quantity: parseFloat(item.quantity) || 1,
      unit: (item.unit || 'unit').toLowerCase(),
      unitPrice: parseFloat(item.unitPrice) || 0,
      totalPrice: parseFloat(item.unitPrice || 0) * parseFloat(item.quantity || 1)
    }));
  } else {
    // If no items extracted, create a generic item
    normalized.items = [{
      name: 'unspecified item',
      quantity: 1,
      unit: 'unit',
      unitPrice: normalized.totalAmount,
      totalPrice: normalized.totalAmount
    }];
    normalized.confidence = 'low';
  }

  return normalized;
}

/**
 * Fallback regex-based extraction when LLM fails
 */
function fallbackExtraction(text) {
  const lowerText = text.toLowerCase();
  
  // Detect transaction type
  let transactionType = 'sale';
  if (lowerText.includes('bought') || lowerText.includes('purchase') || lowerText.includes('nilinunua')) {
    transactionType = 'purchase';
  } else if (lowerText.includes('expense') || lowerText.includes('spent') || lowerText.includes('matumizi')) {
    transactionType = 'expense';
  } else if (lowerText.includes('debt') || lowerText.includes('owe') || lowerText.includes('deni')) {
    transactionType = 'debt';
  }

  // Extract amounts
  const amountRegex = /(?:ksh|kes|shilingi)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi;
  const amounts = [];
  let match;
  while ((match = amountRegex.exec(text)) !== null) {
    amounts.push(parseFloat(match[1].replace(/,/g, '')));
  }
  const totalAmount = amounts[0] || 0;

  // Extract quantities and units
  const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|kilo|pieces|pcs|liters|litres|units?|bags?)/gi;
  const items = [];
  const quantityMatches = [...text.matchAll(quantityRegex)];
  
  if (quantityMatches.length > 0) {
    quantityMatches.forEach(qMatch => {
      const quantity = parseFloat(qMatch[1]);
      const unit = normalizeUnit(qMatch[2]);
      
      // Try to find item name before quantity
      const beforeQuantity = text.substring(0, qMatch.index).split(/\s+/).slice(-3).join(' ').toLowerCase();
      const itemName = extractItemName(beforeQuantity) || 'item';
      
      items.push({
        name: itemName,
        quantity,
        unit,
        unitPrice: totalAmount / quantity || 0,
        totalPrice: totalAmount
      });
    });
  } else {
    // No quantity found, create generic item
    items.push({
      name: extractItemName(lowerText) || 'item',
      quantity: 1,
      unit: 'unit',
      unitPrice: totalAmount,
      totalPrice: totalAmount
    });
  }

  // Extract customer name (capitalized words)
  const nameRegex = /(?:to|from|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/;
  const nameMatch = text.match(nameRegex);
  const customerName = nameMatch ? nameMatch[1] : null;

  return {
    transactionType,
    items: items.length > 0 ? items : [{
      name: 'unspecified',
      quantity: 1,
      unit: 'unit',
      unitPrice: totalAmount,
      totalPrice: totalAmount
    }],
    totalAmount,
    customerName,
    date: null,
    notes: null,
    confidence: 'medium'
  };
}

/**
 * Normalize unit names
 */
function normalizeUnit(unit) {
  const normalized = unit.toLowerCase();
  if (normalized.includes('kilo') || normalized === 'kg') return 'kg';
  if (normalized.includes('piece') || normalized === 'pcs') return 'pieces';
  if (normalized.includes('liter') || normalized.includes('litre')) return 'liters';
  if (normalized.includes('bag')) return 'bags';
  return 'unit';
}

/**
 * Extract item names from common vegetables/products
 */
function extractItemName(text) {
  const commonItems = {
    // English
    'tomato': 'tomatoes', 'onion': 'onions', 'cabbage': 'cabbage',
    'carrot': 'carrots', 'potato': 'potatoes', 'spinach': 'spinach',
    'kale': 'kale', 'lettuce': 'lettuce', 'pepper': 'peppers',
    
    // Kiswahili
    'nyanya': 'tomatoes', 'vitunguu': 'onions', 'kabichi': 'cabbage',
    'karoti': 'carrots', 'viazi': 'potatoes', 'sukuma': 'kale',
    'pilipili': 'peppers', 'kunde': 'beans', 'maharagwe': 'beans'
  };

  for (const [key, value] of Object.entries(commonItems)) {
    if (text.includes(key)) return value;
  }
  
  return null;
}

/**
 * Detect language from text
 */
export function detectLanguage(text) {
  const swahiliKeywords = ['nimeuza', 'nilinunua', 'shilingi', 'kilo', 'leo', 'jana', 'nyanya', 'vitunguu'];
  const lowerText = text.toLowerCase();
  
  for (const keyword of swahiliKeywords) {
    if (lowerText.includes(keyword)) return 'sw';
  }
  
  return 'en';
}

/**
 * Generate confirmation message
 */
export function generateConfirmation(extractedData, language = 'en') {
  const { transactionType, items, totalAmount, customerName } = extractedData;
  
  if (language === 'sw') {
    const typeText = {
      'sale': 'Mauzo',
      'purchase': 'Ununuzi',
      'expense': 'Matumizi',
      'debt': 'Deni'
    }[transactionType] || 'Muamala';
    
    let message = `✅ ${typeText} imerekodiwa:\n`;
    items.forEach(item => {
      message += `- ${item.name}: ${item.quantity} ${item.unit} @ KES ${item.unitPrice.toFixed(2)}\n`;
    });
    message += `\nJumla: KES ${totalAmount.toFixed(2)}`;
    if (customerName) message += `\nMteja: ${customerName}`;
    
    return message;
  }
  
  // English
  const typeText = {
    'sale': 'Sale',
    'purchase': 'Purchase',
    'expense': 'Expense',
    'debt': 'Debt'
  }[transactionType] || 'Transaction';
  
  let message = `✅ ${typeText} recorded successfully:\n`;
  items.forEach(item => {
    message += `- ${item.name}: ${item.quantity} ${item.unit} @ KES ${item.unitPrice.toFixed(2)}\n`;
  });
  message += `\nTotal: KES ${totalAmount.toFixed(2)}`;
  if (customerName) message += `\nCustomer: ${customerName}`;
  
  return message;
}
