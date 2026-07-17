import type { Category, TransactionType } from '../types';

interface DetectionResult {
  category: Category;
  type: TransactionType;
}

/**
 * Keyword-based category auto-detection from transaction descriptions.
 *
 * Covers:
 *   1. Indian merchants (Zomato, Swiggy, Ola, Flipkart, etc.)
 *   2. Global/US merchants (Walmart, Amazon, Target, DoorDash, Uber, etc.)
 *   3. UK merchants (Tesco, Sainsbury's, Deliveroo, etc.)
 *
 * Falls through to null if no match — the caller should either leave the
 * category blank (server-side Gemini auto-categorization will handle it)
 * or use a generic fallback.
 */

// ── Expense merchants ────────────────────────────────────────────────────────

const FOOD_KEYWORDS = [
  'zomato', 'swiggy', 'food', 'lunch', 'dinner', 'breakfast',
  'coffee', 'chai', 'restaurant', 'cafe', 'pizza', 'burger',
  'doordash', 'ubereats', 'grubhub', 'deliveroo', 'justeat', 'menulog',
  'mcdonald', 'starbucks', 'subway', 'kfc', 'domino', 'chipotle',
  'wendy', 'tacobell', 'pret', 'nando', 'wagamama', 'grocer',
  'supermarket', 'tesco', 'sainsbury', 'asda', 'morrisons', 'waitrose',
  'aldi', 'lidl', 'costco', 'walmart', 'target', 'wholefoods',
  'carrefour', 'coles', 'woolworths',
];

const TRANSPORT_KEYWORDS = [
  'uber', 'ola', 'metro', 'petrol', 'fuel', 'bus',
  'auto', 'rickshaw', 'rapido', 'lyft', 'taxi', 'train',
  'parking', 'toll', 'shell', 'bp ', 'grab', 'gojek',
  'lime', 'bird', 'tfl', 'oyster',
];

const SHOPPING_KEYWORDS = [
  'amazon', 'flipkart', 'myntra', 'clothes', 'shirt', 'shoes',
  'ajio', 'nykaa', 'meesho', 'ebay', 'etsy', 'aliexpress',
  'nike', 'adidas', 'zara', 'h&m', 'ikea', 'bestbuy',
  'apple.com', 'unqilo',
];

const ENTERTAINMENT_KEYWORDS = [
  'netflix', 'movie', 'game', 'spotify', 'prime', 'hotstar',
  'concert', 'cricket', 'disney+', 'hulu', 'hbo', 'youtube',
  'apple.com/bill', 'steam', 'playstation', 'xbox', 'nintendo',
  'ticketmaster', 'stubhub', 'fandango',
];

const HEALTH_KEYWORDS = [
  'doctor', 'medicine', 'hospital', 'pharmacy', 'clinic', 'health',
  'medical', 'apollo', '1mg', 'cvs', 'walgreens', 'boots',
  'dentist', 'optometrist', 'therapy', 'gym', 'fitness',
];

const HOUSING_KEYWORDS = [
  'rent', 'electricity', 'water', 'wifi', 'maintenance', 'gas',
  'housing', 'society', 'internet', 'phone bill', 'broadband',
  'utility', 'council tax', 'mortgage', 'hoa',
];

const EDUCATION_KEYWORDS = [
  'course', 'book', 'tuition', 'school', 'college', 'udemy',
  'education', 'coaching', 'coursera', 'skillshare', 'kindle',
  'audible', 'university',
];

// ── Income merchants ─────────────────────────────────────────────────────────

const SALARY_KEYWORDS = [
  'salary', 'paycheck', 'ctc', 'payroll', 'stipend',
  'direct deposit', 'paychex', 'adp',
];

const FREELANCE_KEYWORDS = [
  'freelance', 'client', 'project', 'consulting', 'invoice',
  'upwork', 'fiverr', 'toptal',
];

const INVESTMENT_KEYWORDS = [
  'dividend', 'mutual fund', 'sip', 'stock', 'investment', 'interest',
  'fd', 'ppf', 'returns', 'etf', 'vanguard', 'fidelity', 'schwab',
  'robinhood', 'wealthsimple', 'trading212',
];

const GIFT_KEYWORDS = [
  'gift', 'bonus', 'reward', 'cashback', 'refund',
  'tax refund', 'venmo', 'paypal',
];

// ── Detection engine ─────────────────────────────────────────────────────────

const EXPENSE_RULES: [Category, string[]][] = [
  ['food', FOOD_KEYWORDS],
  ['transport', TRANSPORT_KEYWORDS],
  ['shopping', SHOPPING_KEYWORDS],
  ['entertainment', ENTERTAINMENT_KEYWORDS],
  ['health', HEALTH_KEYWORDS],
  ['housing', HOUSING_KEYWORDS],
  ['education', EDUCATION_KEYWORDS],
];

const INCOME_RULES: [Category, string[]][] = [
  ['salary', SALARY_KEYWORDS],
  ['freelance', FREELANCE_KEYWORDS],
  ['investment', INVESTMENT_KEYWORDS],
  ['gift', GIFT_KEYWORDS],
];

function matchAny(d: string, keywords: string[]): boolean {
  return keywords.some((kw) => {
    // Short keywords (≤3 chars) need word-boundary match to avoid
    // false positives like "tfl" inside "netflix"
    if (kw.length <= 3) {
      const idx = d.indexOf(kw);
      if (idx === -1) return false;
      // Check that it's at a word boundary
      const before = idx === 0 || d[idx - 1] === ' ' || d[idx - 1] === '.' || d[idx - 1] === '-';
      const after = idx + kw.length >= d.length || d[idx + kw.length] === ' ' || d[idx + kw.length] === '.' || d[idx + kw.length] === '-';
      return before && after;
    }
    return d.includes(kw);
  });
}

export const autoDetectCategory = (
  description: string,
  currentType: TransactionType
): DetectionResult | null => {
  const d = description.toLowerCase().trim();
  if (!d) return null;

  // Try the current type's rules first (priority match)
  const primaryRules = currentType === 'income' ? INCOME_RULES : EXPENSE_RULES;
  for (const [category, keywords] of primaryRules) {
    if (matchAny(d, keywords)) {
      return { category, type: currentType };
    }
  }

  // Fall through to the opposite type's rules (type switching)
  const oppositeRules = currentType === 'income' ? EXPENSE_RULES : INCOME_RULES;
  const oppositeType: TransactionType = currentType === 'income' ? 'expense' : 'income';
  for (const [category, keywords] of oppositeRules) {
    if (matchAny(d, keywords)) {
      return { category, type: oppositeType };
    }
  }

  return null;
};
