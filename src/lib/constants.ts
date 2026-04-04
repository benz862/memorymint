// ============================================
// MemoryMint — Constants & Pricing
// ============================================

import { PricingTier, Tone, OccasionSubtype, DesiredLength } from '@/types';

// --- Pricing ---

export const PRICING: Record<string, PricingTier> = {
  '4x6': {
    size: '4x6',
    price: 3.99,
    label: '4×6 Card',
    dimensions: '4" × 6"',
    stripePriceId: 'price_1TIUMjE6oTidvpnU0BDTIukc',
  },
  '5x7': {
    size: '5x7',
    price: 5.99,
    label: '5×7 Card',
    dimensions: '5" × 7"',
    stripePriceId: 'price_1TIUMkE6oTidvpnUl5bLIvTF',
  },
};

// --- Word Count Limits ---

export const WORD_LIMITS: Record<DesiredLength, { min: number; max: number }> = {
  short: { min: 60, max: 90 },
  medium: { min: 90, max: 130 },
  full: { min: 120, max: 150 },
};

// --- Tones ---

export const TONES: { value: Tone; label: string; description: string }[] = [
  { value: 'heartfelt', label: 'Heartfelt', description: 'Warm and genuine' },
  { value: 'romantic', label: 'Romantic', description: 'Tender and loving' },
  { value: 'playful', label: 'Playful', description: 'Light and fun' },
  { value: 'deeply emotional', label: 'Deeply Emotional', description: 'Intense and moving' },
  { value: 'poetic', label: 'Poetic', description: 'Lyrical and beautiful' },
  { value: 'sincere', label: 'Sincere', description: 'Honest and direct' },
];

// --- Occasion Subtypes (grouped by theme) ---

export const OCCASION_SUBTYPES: { value: OccasionSubtype; label: string }[] = [
  // Romantic
  { value: 'just-because',     label: 'Just Because' },
  { value: 'anniversary',      label: 'Anniversary' },
  { value: 'i-miss-you',       label: 'I Miss You' },
  { value: 'apology',          label: 'Apology' },
  { value: 'valentines',       label: "Valentine's" },
  // Birthday
  { value: 'happy-birthday',   label: 'Happy Birthday' },
  { value: 'milestone-birthday', label: 'Milestone Birthday' },
  { value: 'kids-birthday',    label: "Kid's Birthday" },
  { value: 'funny-birthday',   label: 'Funny Birthday' },
  { value: 'belated-birthday', label: 'Belated Birthday' },
];

export const OCCASION_SUBTYPE_GROUPS: {
  label: string;
  options: { value: OccasionSubtype; label: string; hint: string }[];
}[] = [
  {
    label: '🎉 Birthday',
    options: [
      { value: 'happy-birthday',     label: 'Happy Birthday',     hint: 'A warm, joyful celebration message' },
      { value: 'milestone-birthday', label: 'Milestone Birthday', hint: 'For a landmark year — 30, 40, 50...' },
      { value: 'kids-birthday',      label: "Kid's Birthday",     hint: 'Fun and playful, written for little ones' },
      { value: 'funny-birthday',     label: 'Funny Birthday',     hint: 'Light-hearted and laugh-out-loud' },
      { value: 'belated-birthday',   label: 'Belated Birthday',   hint: 'Better late than never — warm and self-aware' },
    ],
  },
  {
    label: '❤️ Love & Romance',
    options: [
      { value: 'just-because',  label: 'Just Because',  hint: 'No occasion needed — pure love' },
      { value: 'anniversary',   label: 'Anniversary',   hint: 'Celebrating time and love together' },
      { value: 'valentines',    label: "Valentine's",   hint: 'For the most romantic day of the year' },
      { value: 'i-miss-you',    label: 'I Miss You',    hint: 'Longing and warmth for someone far away' },
      { value: 'apology',       label: 'Apology',       hint: 'Heartfelt words to make things right' },
    ],
  },
];

// --- Length Options ---

export const LENGTH_OPTIONS: { value: DesiredLength; label: string; description: string }[] = [
  { value: 'short', label: 'Short', description: '60–90 words' },
  { value: 'medium', label: 'Medium', description: '90–130 words' },
  { value: 'full', label: 'Full', description: '120–150 words' },
];

// --- Image Upload ---

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// --- Card Dimensions (in points, 1 inch = 72 points) ---

export const CARD_DIMENSIONS = {
  '4x6': { width: 288, height: 432, widthIn: 4, heightIn: 6 },
  '5x7': { width: 360, height: 504, widthIn: 5, heightIn: 7 },
};

// --- Watermark ---

export const WATERMARK_TEXT = 'PREVIEW • MemoryMint';

// --- Themes for Future ---

export const COMING_SOON_THEMES = [
  { name: 'Birthday', slug: 'birthday', emoji: '🎂' },
  { name: 'Anniversary', slug: 'anniversary', emoji: '💍' },
  { name: 'Sympathy', slug: 'sympathy', emoji: '🕊️' },
  { name: 'Memorial', slug: 'memorial', emoji: '🕯️' },
  { name: 'Get Well', slug: 'get-well', emoji: '🌻' },
  { name: 'Thank You', slug: 'thank-you', emoji: '🙏' },
  { name: 'Apology', slug: 'apology', emoji: '💐' },
];

// --- Site Copy ---

export const SITE = {
  name: 'MemoryMint',
  tagline: 'Turn your memories into a card worth keeping.',
  description:
    'Enter the moments, memories, and feelings that matter most. We\'ll help shape them into a heartfelt message and place it inside a beautiful print-ready card.',
  cta: 'Create My Card',
  ctaSecondary: 'See a Sample',
};
