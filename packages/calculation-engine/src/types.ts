/**
 * @tictacstick/calculation-engine - Type Definitions
 * 
 * Comprehensive TypeScript interfaces for the TicTacStick Quote Engine.
 * Ported from v1.x ES5 implementation with enhanced type safety.
 */

// ============================================
// Difficulty and Condition Levels
// ============================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'extreme';
export type ConditionLevel = 'light' | 'medium' | 'heavy' | 'severe' | 'specialist' | 'delicate';
export type SoilLevel = 'light' | 'medium' | 'heavy';
export type TintLevel = 'none' | 'light' | 'heavy';
export type AccessLevel = 'easy' | 'ladder' | 'highReach';
export type JobType = 'window' | 'pressure';

// ============================================
// Window Types
// ============================================

export type WindowCategory = 
  | 'sliding' 
  | 'awning' 
  | 'fixed' 
  | 'louvre' 
  | 'double' 
  | 'door' 
  | 'feature' 
  | 'commercial' 
  | 'skylight' 
  | 'balustrade';

/**
 * Window type definition from pricing data
 */
export interface WindowType {
  id: string;
  label: string;
  description?: string;
  category?: WindowCategory;
  baseMinutesInside: number;
  baseMinutesOutside: number;
  basePrice?: number;
  difficulty?: DifficultyLevel;
  icon?: string;
  tags?: string[];
}

// ============================================
// Pressure Surfaces
// ============================================

export type PressureSurfaceCategory = 
  | 'driveway' 
  | 'patio' 
  | 'decking' 
  | 'roof' 
  | 'walls' 
  | 'paths' 
  | 'garage' 
  | 'commercial' 
  | 'sports' 
  | 'public' 
  | 'fence';

/**
 * Pressure surface type definition
 */
export interface PressureSurface {
  id: string;
  label: string;
  category: PressureSurfaceCategory;
  minutesPerSqm: number;
  baseRate?: number;
  difficulty?: DifficultyLevel;
  notes?: string;
  tags?: string[];
}

// ============================================
// Modifiers and Conditions
// ============================================

/**
 * Modifier categories for grouping in UI
 */
export type ModifierCategory =
  // Window conditions
  | 'debris'       // Dirt/dust level
  | 'staining'     // Hard water, paint, oxidation
  | 'screens'      // Screen and frame cleaning
  // Access modifiers
  | 'height'       // Ladder, rope access, etc.
  | 'obstacles'    // Furniture, plants, terrain
  // Pressure conditions
  | 'dirt'         // Dirt level for pressure
  | 'organic'      // Mould, moss, algae
  | 'surface'      // Surface condition
  // Technique modifiers
  | 'window'       // Window cleaning techniques
  | 'pressure'     // Pressure cleaning techniques
  | 'treatment';   // Chemical treatments

/**
 * Base modifier interface
 * Used for all condition and modifier types
 */
export interface Modifier {
  id: string;
  label: string;
  category: ModifierCategory;
  timeMultiplier: number;
  priceMultiplier: number;
  description?: string;
  icon?: string;
  recommended?: boolean;
  notes?: string;
  // Legacy fields for compatibility
  name?: string;
  level?: ConditionLevel | DifficultyLevel;
  multiplier?: number;
  color?: string;
  materials?: string;
  equipment?: string;
  applicableTo?: JobType[];
}

/**
 * Window condition modifier
 * Debris, staining, screens categories
 */
export interface WindowCondition extends Modifier {
  category: 'debris' | 'staining' | 'screens';
}

/**
 * Access/difficulty modifier
 * Height and obstacles categories
 */
export interface AccessModifier extends Modifier {
  category: 'height' | 'obstacles';
}

/**
 * Pressure cleaning condition
 * Dirt, organic, surface categories
 */
export interface PressureCondition extends Modifier {
  category: 'dirt' | 'organic' | 'surface';
}

/**
 * Technique modifier (e.g., soft wash, hot water)
 * Window, pressure, treatment categories
 */
export interface TechniqueModifier extends Modifier {
  category: 'window' | 'pressure' | 'treatment';
}

/**
 * Combined modifier preset for quick selection
 */
export interface ConditionPreset {
  id: string;
  name: string;
  condition: string;
  access: string;
  description?: string;
  estimatedMultiplier: number;
}

// ============================================
// Line Items
// ============================================

/**
 * Window line item in a quote
 */
export interface WindowLineItem {
  id: string;
  windowTypeId: string;
  windowType?: WindowType;
  panes: number;
  width?: number;
  height?: number;
  inside: boolean;
  outside: boolean;
  
  // Access
  highReach: boolean;
  highReachLevel?: number;
  accessId?: string;
  
  // Condition
  conditionId?: string;
  soilLevel?: SoilLevel;
  tintLevel?: TintLevel;
  
  // Extras
  trackClean?: boolean;
  screenClean?: boolean;
  location?: string;
  notes?: string;
  
  // Custom modifiers
  modifiers?: string[];
  
  // Calculated values (populated after calculation)
  calculatedMinutes?: number;
  calculatedCost?: number;
}

/**
 * Pressure line item in a quote
 */
export interface PressureLineItem {
  id: string;
  surfaceId: string;
  surface?: PressureSurface;
  areaSqm: number;
  
  // Condition
  conditionId?: string;
  soilLevel?: SoilLevel;
  
  // Access
  access?: AccessLevel;
  
  // Extras
  includeSealing?: boolean;
  notes?: string;
  
  // Custom modifiers
  modifiers?: string[];
  
  // Calculated values
  calculatedMinutes?: number;
  calculatedCost?: number;
}

// ============================================
// Quote
// ============================================

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

/**
 * Complete quote structure
 */
export interface Quote {
  id: string;
  quoteNumber?: string;
  clientId?: string;
  client?: Client;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
  
  // Status
  status: QuoteStatus;
  
  // Line items
  windowLines: WindowLineItem[];
  pressureLines: PressureLineItem[];
  
  // Pricing config (snapshot at quote time)
  pricingConfig: PricingConfig;
  
  // Calculated totals
  subtotal: number;
  gst: number;
  total: number;
  estimatedMinutes: number;
  
  // Metadata
  notes?: string;
  termsAccepted?: boolean;
  signatureData?: string;
}

// ============================================
// Client
// ============================================

export type ClientType = 'residential' | 'commercial' | 'strata';

/**
 * Client/customer record
 */
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  
  // Address
  address?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  
  // Business details
  type: ClientType;
  businessName?: string;
  abn?: string;
  
  // Property details
  propertyType?: string;
  stories?: number;
  notes?: string;
  
  // Tracking
  createdAt: string;
  updatedAt: string;
  lastQuoteDate?: string;
  totalQuotes?: number;
  totalInvoices?: number;
  
  // Tags for filtering
  tags?: string[];
}

// ============================================
// Invoice
// ============================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'eftpos' | 'transfer' | 'other';

/**
 * Invoice record
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId?: string;
  clientId: string;
  client?: Client;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  paidDate?: string;
  
  // Status
  status: InvoiceStatus;
  
  // Amounts
  subtotal: number;
  gst: number;
  total: number;
  amountPaid: number;
  balance: number;
  
  // Payment
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  
  // Content
  lineItems: InvoiceLineItem[];
  notes?: string;
  terms?: string;
}

/**
 * Invoice line item (simplified from quote)
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// ============================================
// Pricing Configuration
// ============================================

/**
 * Business pricing configuration
 */
export interface PricingConfig {
  // Base rates
  baseFee: number;
  hourlyRate: number;
  minimumJob: number;
  
  // Window rates
  insideMultiplier: number;
  outsideMultiplier: number;
  highReachModifierPercent: number;
  
  // Pressure rates
  pressureHourlyRate: number;
  
  // Time buffers
  setupBufferMinutes: number;
  
  // Travel
  travelMinutes?: number;
  travelKm?: number;
  travelRatePerHour?: number;
  travelRatePerKm?: number;
  
  // GST
  gstRate?: number;
  includeGst?: boolean;
  
  // Modifiers lookup
  conditionMultipliers?: Record<string, number>;
  accessMultipliers?: Record<string, number>;
  
  // Per-surface rates for pressure
  pressureRates?: Record<string, number>;
}

// ============================================
// Business Settings
// ============================================

/**
 * Business configuration and branding
 */
export interface BusinessSettings {
  id: string;
  name: string;
  abn?: string;
  phone?: string;
  email?: string;
  website?: string;
  
  // Address
  address?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  
  // Branding
  logo?: string;
  primaryColor?: string;
  
  // Invoice/quote settings
  invoicePrefix?: string;
  quotePrefix?: string;
  invoiceTerms?: string;
  quoteTerms?: string;
  paymentTermsDays?: number;
  quoteValidDays?: number;
  
  // Bank details for invoices
  bankName?: string;
  bsb?: string;
  accountNumber?: string;
  accountName?: string;
}

// ============================================
// Calculation Results
// ============================================

/**
 * Money breakdown from calculation
 */
export interface MoneyBreakdown {
  baseFee: number;
  windows: number;
  pressure: number;
  setup: number;
  travel: number;
  highReach: number;
  subtotal: number;
  minimumJob: number;
  total: number;
}

/**
 * Time breakdown from calculation
 */
export interface TimeBreakdown {
  windowsMinutes: number;
  pressureMinutes: number;
  highReachMinutes: number;
  setupMinutes: number;
  travelMinutes: number;
  windowsHours: number;
  pressureHours: number;
  highReachHours: number;
  setupHours: number;
  travelHours: number;
  totalMinutes: number;
  totalHours: number;
}

/**
 * Individual line item calculation result
 */
export interface LineItemResult {
  id: string;
  description: string;
  amount: number;
  minutes: number;
}

/**
 * Complete calculation result
 */
export interface CalculationResult {
  money: MoneyBreakdown;
  time: TimeBreakdown;
  lineItems: LineItemResult[];
  subtotal: number;
  gst: number;
  total: number;
  estimatedTime: number;
}

// ============================================
// Analytics
// ============================================

/**
 * Job performance record for analytics
 */
export interface JobRecord {
  id: string;
  quoteId?: string;
  invoiceId?: string;
  clientId?: string;
  
  // Time tracking
  date: string;
  quotedMinutes: number;
  actualMinutes?: number;
  
  // Money
  quotedAmount: number;
  actualAmount: number;
  
  // Breakdown
  windowCount?: number;
  pressureArea?: number;
  
  // Profitability
  effectiveHourlyRate?: number;
  profitMargin?: number;
}

/**
 * Period summary for analytics dashboard
 */
export interface PeriodSummary {
  period: string;
  startDate: string;
  endDate: string;
  
  // Counts
  quoteCount: number;
  invoiceCount: number;
  jobCount: number;
  
  // Money
  totalQuoted: number;
  totalInvoiced: number;
  totalPaid: number;
  
  // Averages
  avgJobValue: number;
  avgHourlyRate: number;
  conversionRate: number;
}

// ============================================
// Storage Types
// ============================================

/**
 * Local storage data structure
 */
export interface StorageData {
  version: string;
  updatedAt: string;
  
  // Core data
  quotes: Quote[];
  invoices: Invoice[];
  clients: Client[];
  jobs: JobRecord[];
  
  // Settings
  pricingConfig: PricingConfig;
  businessSettings: BusinessSettings;
  
  // Preferences
  userPreferences?: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultJobType: JobType;
  showGstSeparate: boolean;
  autoSave: boolean;
  syncEnabled: boolean;
}

// ============================================
// API Types (for meta-api integration)
// ============================================

export interface ApiResponse<T> {
  data: T;
  updatedAt: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  updatedAt: string;
}
