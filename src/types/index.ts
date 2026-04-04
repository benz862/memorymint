// ============================================
// MemoryMint — Core Types
// ============================================

// --- Enums ---

export type CardSize = '4x6' | '5x7';

export type DesiredLength = 'short' | 'medium' | 'full';

export type Tone =
  | 'heartfelt'
  | 'romantic'
  | 'playful'
  | 'deeply emotional'
  | 'poetic'
  | 'sincere';

export type OccasionSubtype =
  // Romantic
  | 'just-because'
  | 'anniversary'
  | 'i-miss-you'
  | 'apology'
  | 'valentines'
  // Birthday
  | 'happy-birthday'
  | 'milestone-birthday'
  | 'kids-birthday'
  | 'funny-birthday'
  | 'belated-birthday';


export type ProjectStatus =
  | 'draft'
  | 'generated'
  | 'reviewed'
  | 'customized'
  | 'previewed'
  | 'purchased'
  | 'delivered';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// --- Database Models ---

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OccasionSubtypeRecord {
  id: string;
  theme_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
}

export interface Template {
  id: string;
  theme_id: string;
  name: string;
  slug: string;
  size_support: CardSize[];
  cover_asset_url: string;
  inside_left_default_asset_url: string;
  inside_right_background_asset_url: string;
  preview_watermark_style: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Font {
  id: string;
  name: string;
  slug: string;
  font_family: string;
  category: string;
  preview_text?: string;
  is_active: boolean;
  sort_order: number;
}

export interface CardProject {
  id: string;
  user_id?: string;
  guest_session_id?: string;
  theme_id: string;
  occasion_subtype_id: string;
  sender_name: string;
  recipient_name: string;
  relationship_label?: string;
  tone: Tone;
  desired_length: DesiredLength;
  memories: string[];
  qualities: string[];
  places: string[];
  inside_jokes: string[];
  desired_feeling: string;
  uploaded_image_url?: string;
  generated_text?: string;
  edited_text?: string;
  selected_font_id?: string;
  selected_template_id?: string;
  selected_size?: CardSize;
  preview_pdf_url?: string;
  final_pdf_url?: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id?: string;
  guest_session_id?: string;
  card_project_id: string;
  order_number: string;
  selected_size: CardSize;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_provider: string;
  provider_payment_id?: string;
  purchaser_email: string;
  created_at: string;
  updated_at: string;
}

export interface Download {
  id: string;
  order_id: string;
  card_project_id: string;
  download_url: string;
  expires_at?: string;
  download_count: number;
  last_downloaded_at?: string;
}

// --- Form / State Types ---

export interface MemoryFormData {
  senderName: string;
  recipientName: string;
  relationshipLabel: string;
  occasionSubtype: OccasionSubtype;
  tone: Tone;
  desiredLength: DesiredLength;
  memories: string[];
  qualities: string[];
  places: string[];
  insideJokes: string[];
  desiredFeeling: string;
  uploadedImage: File | null;
  uploadedImagePreview: string | null;
}

export interface CardCustomization {
  size: CardSize;
  templateId: string;
  fontId: string;
}

export interface CardProjectState {
  step: number;
  themeId: string;
  formData: MemoryFormData;
  generatedText: string;
  editedText: string;
  customization: CardCustomization;
  uploadedImageUrl: string | null;
  projectId: string | null;
}

// --- API Types ---

export interface GenerateRequest {
  formData: MemoryFormData;
}

export interface GenerateResponse {
  message: string;
  wordCount: number;
}

export interface CheckoutRequest {
  projectId: string;
  size: CardSize;
  email: string;
}

// --- Pricing ---

export interface PricingTier {
  size: CardSize;
  price: number;
  label: string;
  dimensions: string;
  stripePriceId: string;
}

// --- Pre-Designed Card Catalogue ---

export interface DesignedCard {
  id: string;
  name: string;
  slug: string;
  category: string;
  front_image_url: string;
  back_image_url: string;
  preview_thumbnail_url: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DesignedCardOrder {
  id: string;
  designed_card_id: string;
  inside_photo_url?: string;
  inside_photo_caption?: string;
  inside_message: string;
  selected_size: CardSize;
  order_number: string;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_provider: string;
  provider_payment_id?: string;
  purchaser_email: string;
  created_at: string;
  updated_at: string;
}

export interface DesignedCardConfigForm {
  insidePhotoFile: File | null;
  insidePhotoPreview: string | null;
  insidePhotoCaption: string;
  insideMessage: string;
  selectedSize: CardSize;
}
