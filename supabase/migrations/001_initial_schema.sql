-- TradeVerified Database Schema
-- Run this in your Supabase SQL Editor or via supabase db push

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE user_role AS ENUM ('tradesperson', 'employer', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'employer', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE trade_type AS ENUM ('hvac', 'plumbing', 'electrical', 'welding', 'carpentry', 'mechanics', 'construction', 'other');
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'filled');
CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE certification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'tradesperson',
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  bio TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT UNIQUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  profile_views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tradesperson profiles
CREATE TABLE tradesperson_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  trade trade_type NOT NULL,
  years_experience INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  availability TEXT DEFAULT 'available',
  license_number TEXT,
  insurance_verified BOOLEAN DEFAULT FALSE,
  background_check BOOLEAN DEFAULT FALSE,
  headline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employer / Company profiles
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  trade trade_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tradesperson_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tradesperson_id UUID NOT NULL REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency INTEGER CHECK (proficiency BETWEEN 1 AND 5) DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tradesperson_id, skill_id)
);

-- Work history
CREATE TABLE work_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tradesperson_id UUID NOT NULL REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certifications
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  issuing_body TEXT NOT NULL,
  trade trade_type,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tradesperson_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tradesperson_id UUID NOT NULL REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  credential_id TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  status certification_status NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tradesperson_id, certification_id)
);

-- Portfolio items
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tradesperson_id UUID NOT NULL REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  before_image_url TEXT,
  after_image_url TEXT,
  image_url TEXT,
  trade trade_type,
  completed_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  trade trade_type NOT NULL,
  job_type TEXT DEFAULT 'full-time',
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  hourly_rate_min DECIMAL(10,2),
  hourly_rate_max DECIMAL(10,2),
  city TEXT,
  state TEXT,
  zip_code TEXT,
  is_remote BOOLEAN DEFAULT FALSE,
  required_certifications TEXT[],
  required_experience INTEGER DEFAULT 0,
  status job_status NOT NULL DEFAULT 'draft',
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job applications
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tradesperson_id UUID NOT NULL REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, tradesperson_id)
);

-- Saved jobs
CREATE TABLE saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Saved candidates (employer)
CREATE TABLE saved_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tradesperson_id UUID NOT NULL REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employer_id, tradesperson_id)
);

-- Reviews (verified only)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tradesperson_id UUID NOT NULL REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT NOT NULL,
  proof_of_service_url TEXT,
  service_date DATE,
  status review_status NOT NULL DEFAULT 'pending',
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  moderation_notes TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  tier subscription_tier NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profile views tracking
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_trade ON tradesperson_profiles(trade);
CREATE INDEX idx_profiles_city_state ON profiles(city, state);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_trade ON jobs(trade);
CREATE INDEX idx_jobs_location ON jobs(city, state);
CREATE INDEX idx_reviews_tradesperson ON reviews(tradesperson_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_applications_job ON job_applications(job_id);
CREATE INDEX idx_applications_tradesperson ON job_applications(tradesperson_id);
CREATE INDEX idx_portfolio_tradesperson ON portfolio_items(tradesperson_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_profiles_search ON profiles USING gin((first_name || ' ' || last_name) gin_trgm_ops);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tradesperson_profiles_updated_at BEFORE UPDATE ON tradesperson_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tradesperson')::user_role,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradesperson_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradesperson_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradesperson_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tradesperson profiles: public read, own write
CREATE POLICY "Tradesperson profiles viewable by everyone" ON tradesperson_profiles FOR SELECT USING (true);
CREATE POLICY "Tradespeople can manage own profile" ON tradesperson_profiles FOR ALL USING (
  user_id = auth.uid()
);

-- Companies: public read, owner write
CREATE POLICY "Companies viewable by everyone" ON companies FOR SELECT USING (true);
CREATE POLICY "Employers can manage own company" ON companies FOR ALL USING (owner_id = auth.uid());

-- Skills: public read
CREATE POLICY "Skills viewable by everyone" ON skills FOR SELECT USING (true);

-- Tradesperson skills: public read, own write
CREATE POLICY "Tradesperson skills viewable" ON tradesperson_skills FOR SELECT USING (true);
CREATE POLICY "Tradespeople manage own skills" ON tradesperson_skills FOR ALL USING (
  tradesperson_id IN (SELECT id FROM tradesperson_profiles WHERE user_id = auth.uid())
);

-- Work history: public read, own write
CREATE POLICY "Work history viewable" ON work_history FOR SELECT USING (true);
CREATE POLICY "Tradespeople manage own work history" ON work_history FOR ALL USING (
  tradesperson_id IN (SELECT id FROM tradesperson_profiles WHERE user_id = auth.uid())
);

-- Certifications: public read
CREATE POLICY "Certifications viewable" ON certifications FOR SELECT USING (true);

-- Tradesperson certifications: public read, own write
CREATE POLICY "Tradesperson certs viewable" ON tradesperson_certifications FOR SELECT USING (true);
CREATE POLICY "Tradespeople manage own certs" ON tradesperson_certifications FOR ALL USING (
  tradesperson_id IN (SELECT id FROM tradesperson_profiles WHERE user_id = auth.uid())
);

-- Portfolio: public read, own write
CREATE POLICY "Portfolio viewable" ON portfolio_items FOR SELECT USING (true);
CREATE POLICY "Tradespeople manage own portfolio" ON portfolio_items FOR ALL USING (
  tradesperson_id IN (SELECT id FROM tradesperson_profiles WHERE user_id = auth.uid())
);

-- Jobs: active jobs public, employer manages own
CREATE POLICY "Active jobs viewable" ON jobs FOR SELECT USING (status = 'active' OR posted_by = auth.uid());
CREATE POLICY "Employers manage own jobs" ON jobs FOR ALL USING (posted_by = auth.uid());

-- Applications: applicant and job poster can see
CREATE POLICY "Applicants see own applications" ON job_applications FOR SELECT USING (
  tradesperson_id IN (SELECT id FROM tradesperson_profiles WHERE user_id = auth.uid())
  OR job_id IN (SELECT id FROM jobs WHERE posted_by = auth.uid())
);
CREATE POLICY "Tradespeople can apply" ON job_applications FOR INSERT WITH CHECK (
  tradesperson_id IN (SELECT id FROM tradesperson_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Employers update application status" ON job_applications FOR UPDATE USING (
  job_id IN (SELECT id FROM jobs WHERE posted_by = auth.uid())
);

-- Saved jobs: own only
CREATE POLICY "Users manage own saved jobs" ON saved_jobs FOR ALL USING (user_id = auth.uid());

-- Saved candidates: employer only
CREATE POLICY "Employers manage saved candidates" ON saved_candidates FOR ALL USING (employer_id = auth.uid());

-- Reviews: public approved reviews, own pending
CREATE POLICY "Approved reviews public" ON reviews FOR SELECT USING (
  status = 'approved' OR reviewer_id = auth.uid() OR
  tradesperson_id IN (SELECT id FROM tradesperson_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can submit reviews" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Admins moderate reviews" ON reviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Messages: sender and recipient
CREATE POLICY "Users see own messages" ON messages FOR SELECT USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Subscriptions: own only
CREATE POLICY "Users see own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());

-- Analytics: own data + admin
CREATE POLICY "Users see own analytics" ON analytics_events FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can log events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Profile views
CREATE POLICY "Profile views insertable" ON profile_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Profile owners see views" ON profile_views FOR SELECT USING (
  profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('portfolio', 'portfolio', true),
  ('certifications', 'certifications', false),
  ('company-logos', 'company-logos', true),
  ('review-proofs', 'review-proofs', false);

-- Storage policies
CREATE POLICY "Avatar uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Portfolio uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Portfolio public read" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Cert uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Cert owner read" ON storage.objects FOR SELECT USING (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Logo uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Logo public read" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Review proof uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed skills
INSERT INTO skills (name, trade) VALUES
  ('Residential HVAC', 'hvac'), ('Commercial HVAC', 'hvac'), ('Refrigeration', 'hvac'),
  ('Ductwork', 'hvac'), ('Heat Pump Installation', 'hvac'), ('Boiler Systems', 'hvac'),
  ('Residential Plumbing', 'plumbing'), ('Commercial Plumbing', 'plumbing'),
  ('Pipe Fitting', 'plumbing'), ('Drain Cleaning', 'plumbing'), ('Water Heater', 'plumbing'),
  ('Gas Lines', 'plumbing'), ('Sewer Systems', 'plumbing'),
  ('Residential Electrical', 'electrical'), ('Commercial Electrical', 'electrical'),
  ('Panel Upgrades', 'electrical'), ('Wiring', 'electrical'), ('Solar Installation', 'electrical'),
  ('Low Voltage', 'electrical'), ('EV Charger Installation', 'electrical'),
  ('MIG Welding', 'welding'), ('TIG Welding', 'welding'), ('Stick Welding', 'welding'),
  ('Pipe Welding', 'welding'), ('Structural Welding', 'welding'),
  ('Framing', 'carpentry'), ('Finish Carpentry', 'carpentry'), ('Cabinet Making', 'carpentry'),
  ('Deck Building', 'carpentry'), ('Roofing', 'carpentry'),
  ('Auto Repair', 'mechanics'), ('Diesel Engines', 'mechanics'), ('Heavy Equipment', 'mechanics'),
  ('Fleet Maintenance', 'mechanics'),
  ('Concrete', 'construction'), ('Masonry', 'construction'), ('Drywall', 'construction'),
  ('Painting', 'construction'), ('Flooring', 'construction'), ('Demolition', 'construction'),
  ('Project Management', 'construction'), ('Blueprint Reading', 'construction');

-- Helper functions
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET profile_views = profile_views + 1 WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_applications_count(job_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE jobs SET applications_count = applications_count + 1 WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed certifications
INSERT INTO certifications (name, issuing_body, trade) VALUES
  ('EPA 608 Certification', 'EPA', 'hvac'),
  ('NATE Certification', 'NATE', 'hvac'),
  ('OSHA 10', 'OSHA', 'construction'),
  ('OSHA 30', 'OSHA', 'construction'),
  ('Journeyman Electrician', 'State Licensing Board', 'electrical'),
  ('Master Electrician', 'State Licensing Board', 'electrical'),
  ('Journeyman Plumber', 'State Licensing Board', 'plumbing'),
  ('Master Plumber', 'State Licensing Board', 'plumbing'),
  ('AWS Certified Welder', 'American Welding Society', 'welding'),
  ('CDL Class A', 'DMV', 'mechanics'),
  ('ASE Certification', 'ASE', 'mechanics'),
  ('General Contractor License', 'State Licensing Board', 'construction');
