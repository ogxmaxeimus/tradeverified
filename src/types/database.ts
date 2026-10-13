export type UserRole = 'tradesperson' | 'employer' | 'admin';
export type SubscriptionTier = 'free' | 'pro' | 'employer' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
export type TradeType = 'hvac' | 'plumbing' | 'electrical' | 'welding' | 'carpentry' | 'mechanics' | 'construction' | 'other';
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'filled';
export type ApplicationStatus = 'pending' | 'reviewed' | 'interviewing' | 'offered' | 'accepted' | 'rejected' | 'withdrawn';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type CertificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';
export type VerificationMethod = 'state_license_board' | 'issuer_portal' | 'third_party' | 'document_review';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  bio: string | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  is_verified: boolean;
  is_featured: boolean;
  profile_views: number;
  created_at: string;
  updated_at: string;
}

export interface TradespersonProfile {
  id: string;
  user_id: string;
  trade: TradeType;
  years_experience: number;
  hourly_rate: number | null;
  availability: string;
  license_number: string | null;
  insurance_verified: boolean;
  background_check: boolean;
  headline: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  skills?: TradespersonSkill[];
  certifications?: TradespersonCertification[];
  work_history?: WorkHistory[];
  portfolio_items?: PortfolioItem[];
  reviews?: Review[];
  avg_rating?: number;
  review_count?: number;
}

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  trade: TradeType | null;
}

export interface TradespersonSkill {
  id: string;
  tradesperson_id: string;
  skill_id: string;
  proficiency: number;
  skill?: Skill;
}

export interface WorkHistory {
  id: string;
  tradesperson_id: string;
  company_name: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  city: string | null;
  state: string | null;
}

export interface Certification {
  id: string;
  name: string;
  issuing_body: string;
  trade: TradeType | null;
  description: string | null;
  verification_url?: string | null;
  requires_license?: boolean | null;
  default_method?: VerificationMethod | null;
}

export interface TradespersonCertification {
  id: string;
  tradesperson_id: string;
  certification_id: string;
  credential_id: string | null;
  license_number?: string | null;
  issuing_state?: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  document_path?: string | null;
  status: CertificationStatus;
  verification_method?: VerificationMethod | null;
  verification_source_url?: string | null;
  verification_reference?: string | null;
  verification_notes?: string | null;
  rejection_reason?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  auto_checked_at?: string | null;
  auto_check_notes?: string | null;
  certification?: Certification;
}

export interface CertificationVerificationEvent {
  id: string;
  tradesperson_certification_id: string;
  actor_id: string | null;
  action: string;
  method: VerificationMethod | null;
  source_url: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export const VERIFICATION_METHOD_LABELS: Record<VerificationMethod, string> = {
  state_license_board: 'State License Board',
  issuer_portal: 'Issuing Body',
  third_party: 'Third-Party Check',
  document_review: 'Document Review',
};

export interface PortfolioItem {
  id: string;
  tradesperson_id: string;
  title: string;
  description: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  image_url: string | null;
  trade: TradeType | null;
  completed_at: string | null;
}

export interface Job {
  id: string;
  company_id: string;
  posted_by: string;
  title: string;
  description: string;
  trade: TradeType;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  is_remote: boolean;
  required_certifications: string[] | null;
  required_experience: number;
  status: JobStatus;
  applications_count: number;
  views_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface JobApplication {
  id: string;
  job_id: string;
  tradesperson_id: string;
  cover_letter: string | null;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
  tradesperson?: TradespersonProfile;
}

export interface Review {
  id: string;
  tradesperson_id: string;
  reviewer_id: string;
  rating: number;
  title: string | null;
  content: string;
  proof_of_service_url: string | null;
  service_date: string | null;
  status: ReviewStatus;
  is_public: boolean;
  created_at: string;
  reviewer?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  job?: Job;
}

export interface SavedCandidate {
  id: string;
  employer_id: string;
  tradesperson_id: string;
  notes: string | null;
  tradesperson?: TradespersonProfile;
}

export const TRADE_LABELS: Record<TradeType, string> = {
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  welding: 'Welding',
  carpentry: 'Carpentry',
  mechanics: 'Mechanics',
  construction: 'Construction',
  other: 'Other',
};

export const TRADE_ICONS: Record<TradeType, string> = {
  hvac: '❄️',
  plumbing: '🔧',
  electrical: '⚡',
  welding: '🔥',
  carpentry: '🪚',
  mechanics: '🔩',
  construction: '🏗️',
  other: '🛠️',
};
