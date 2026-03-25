-- MazaoChain schema for Neon PostgreSQL
-- profiles.id stores Clerk user IDs (e.g. "user_abc123")

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('agriculteur', 'cooperative', 'preteur', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT NOT NULL PRIMARY KEY,
  role user_role NOT NULL,
  wallet_address TEXT,
  is_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  superficie DECIMAL NOT NULL CHECK (superficie > 0),
  localisation TEXT NOT NULL,
  crop_type TEXT,
  rendement_historique DECIMAL,
  experience_annees INTEGER,
  cooperative_id TEXT REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS cooperative_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  region TEXT NOT NULL,
  members_count INTEGER DEFAULT 0 CHECK (members_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS lender_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  available_funds DECIMAL DEFAULT 0 CHECK (available_funds >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS crop_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL CHECK (crop_type IN ('manioc', 'cafe')),
  superficie DECIMAL NOT NULL CHECK (superficie > 0),
  rendement_historique DECIMAL NOT NULL CHECK (rendement_historique > 0),
  prix_reference DECIMAL NOT NULL CHECK (prix_reference > 0),
  valeur_estimee DECIMAL NOT NULL CHECK (valeur_estimee > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  lender_id TEXT REFERENCES profiles(id),
  principal DECIMAL NOT NULL CHECK (principal > 0),
  collateral_amount DECIMAL NOT NULL CHECK (collateral_amount > 0),
  interest_rate DECIMAL NOT NULL CHECK (interest_rate >= 0),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'repaid', 'defaulted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('mint', 'burn', 'loan', 'repayment', 'transfer')),
  from_address TEXT,
  to_address TEXT,
  amount DECIMAL NOT NULL CHECK (amount >= 0),
  token_type TEXT NOT NULL CHECK (token_type IN ('MAZAO', 'USDC')),
  hedera_transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tokenization_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES crop_evaluations(id) ON DELETE CASCADE,
  token_id TEXT,
  token_symbol TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_validated ON profiles(is_validated);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id ON farmer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_cooperative_id ON farmer_profiles(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_profiles_user_id ON cooperative_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_lender_profiles_user_id ON lender_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_evaluations_farmer_id ON crop_evaluations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_evaluations_status ON crop_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_lender_id ON loans(lender_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
