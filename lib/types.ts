export type Role = "worker" | "employer";
export type Plan = "free" | "pro" | "employer";
export type Trade =
  | "HVAC"
  | "Plumbing"
  | "Electrical"
  | "Welding"
  | "Carpentry"
  | "Mechanics"
  | "Pipefitting"
  | "Construction";
export type JobType = "Full-time" | "Contract" | "Apprenticeship";
export type ApplicationStatus =
  | "New"
  | "In Review"
  | "Shortlisted"
  | "Hired"
  | "Not Selected"
  | "Withdrawn";
export type CredentialStatus = "pending" | "verified";
export type Availability = "Available now" | "Booking 2 weeks" | "Limited";

export type User = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  plan: Plan;
  createdAt: string;
  professionalId?: string;
  companyId?: string;
};

export type Credential = {
  id: string;
  name: string;
  detail: string;
  issuer: string;
  issued: string;
  expires: string;
  status: CredentialStatus;
  source: string;
  reference: string;
};

export type PortfolioItem = {
  id: string;
  title: string;
  location: string;
  summary: string;
  image?: string;
};

export type Review = {
  id: string;
  author: string;
  authorUserId?: string;
  location: string;
  rating: number;
  body: string;
  createdAt: string;
  tags: string[];
  proof: string;
};

export type Professional = {
  id: string;
  userId: string;
  slug: string;
  name: string;
  trade: Trade;
  title: string;
  city: string;
  region: string;
  about: string;
  skills: string[];
  years: number;
  rate: string;
  availability: Availability;
  licensed: boolean;
  insured: boolean;
  backgroundChecked: boolean;
  osha: boolean;
  featured: boolean;
  views: number;
  credentials: Credential[];
  portfolio: PortfolioItem[];
  reviews: Review[];
};

export type Company = {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  location: string;
  about: string;
  website: string;
  focus: string;
  views: number;
};

export type Job = {
  id: string;
  companyId: string;
  title: string;
  trade: Trade;
  city: string;
  region: string;
  type: JobType;
  pay: string;
  description: string;
  requirements: string[];
  createdAt: string;
};

export type Application = {
  id: string;
  jobId: string;
  professionalId: string;
  note: string;
  status: ApplicationStatus;
  createdAt: string;
};

export type Thread = {
  id: string;
  participantIds: string[];
  updatedAt: string;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export type Group = {
  id: string;
  name: string;
  trade: Trade;
  about: string;
  baselineMembers: number;
};

export type GroupPost = {
  id: string;
  groupId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Article = {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  body: string[];
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  createdAt: string;
};

export type AppState = {
  version: 1;
  users: User[];
  professionals: Professional[];
  companies: Company[];
  jobs: Job[];
  applications: Application[];
  threads: Thread[];
  messages: Message[];
  notifications: Notification[];
  savedPros: Record<string, string[]>;
  savedJobs: Record<string, string[]>;
  memberships: Record<string, string[]>;
  groupPosts: GroupPost[];
  leads: Lead[];
  sessionUserId: string | null;
};

export const TRADES: Trade[] = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Welding",
  "Carpentry",
  "Mechanics",
  "Pipefitting",
  "Construction",
];

export const DEMO_PASSWORD = "demo1234";
