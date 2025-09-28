-- Create user role enum
CREATE TYPE user_role AS ENUM ('agriculteur', 'cooperative', 'preteur','admin');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role NOT NULL,
  wallet_address TEXT,
  is_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create farmer profiles table
CREATE TABLE farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  superficie DECIMAL NOT NULL CHECK (superficie > 0),
  localisation TEXT NOT NULL,
  cooperative_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create cooperative profiles table
CREATE TABLE cooperative_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  region TEXT NOT NULL,
  members_count INTEGER DEFAULT 0 CHECK (members_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create lender profiles table
CREATE TABLE lender_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  available_funds DECIMAL DEFAULT 0 CHECK (available_funds >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create crop evaluations table
CREATE TABLE crop_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL CHECK (crop_type IN ('manioc', 'cafe')),
  superficie DECIMAL NOT NULL CHECK (superficie > 0),
  rendement_historique DECIMAL NOT NULL CHECK (rendement_historique > 0),
  prix_reference DECIMAL NOT NULL CHECK (prix_reference > 0),
  valeur_estimee DECIMAL NOT NULL CHECK (valeur_estimee > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lender_id UUID REFERENCES profiles(id),
  principal DECIMAL NOT NULL CHECK (principal > 0),
  collateral_amount DECIMAL NOT NULL CHECK (collateral_amount > 0),
  interest_rate DECIMAL NOT NULL CHECK (interest_rate >= 0),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'repaid', 'defaulted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table for tracking blockchain transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('mint', 'burn', 'loan', 'repayment', 'transfer')),
  from_address TEXT,
  to_address TEXT,
  amount DECIMAL NOT NULL CHECK (amount >= 0),
  token_type TEXT NOT NULL CHECK (token_type IN ('MAZAO', 'USDC')),
  hedera_transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_validated ON profiles(is_validated);
CREATE INDEX idx_farmer_profiles_user_id ON farmer_profiles(user_id);
CREATE INDEX idx_farmer_profiles_cooperative_id ON farmer_profiles(cooperative_id);
CREATE INDEX idx_cooperative_profiles_user_id ON cooperative_profiles(user_id);
CREATE INDEX idx_lender_profiles_user_id ON lender_profiles(user_id);
CREATE INDEX idx_crop_evaluations_farmer_id ON crop_evaluations(farmer_id);
CREATE INDEX idx_crop_evaluations_status ON crop_evaluations(status);
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_lender_id ON loans(lender_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles: Users can read their own profile and cooperatives can read farmer profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Cooperatives can view farmer profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'cooperative'
    )
    AND role = 'agriculteur'
  );

-- Farmer profiles: Users can manage their own, cooperatives can read
CREATE POLICY "Users can manage own farmer profile" ON farmer_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Cooperatives can view farmer profiles" ON farmer_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'cooperative'
    )
  );

-- Cooperative profiles: Users can manage their own
CREATE POLICY "Users can manage own cooperative profile" ON cooperative_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Lender profiles: Users can manage their own
CREATE POLICY "Users can manage own lender profile" ON lender_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Crop evaluations: Farmers can manage their own, cooperatives can view/approve
CREATE POLICY "Farmers can manage own evaluations" ON crop_evaluations
  FOR ALL USING (auth.uid() = farmer_id);

CREATE POLICY "Cooperatives can view all evaluations" ON crop_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'cooperative'
    )
  );

CREATE POLICY "Cooperatives can update evaluation status" ON crop_evaluations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'cooperative'
    )
  );

-- Loans: Borrowers and lenders can view their loans, cooperatives can view all
CREATE POLICY "Users can view own loans" ON loans
  FOR SELECT USING (
    auth.uid() = borrower_id OR auth.uid() = lender_id
  );

CREATE POLICY "Borrowers can create loans" ON loans
  FOR INSERT WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Cooperatives can view all loans" ON loans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'cooperative'
    )
  );

CREATE POLICY "Cooperatives can update loan status" ON loans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'cooperative'
    )
  );

-- Transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    max_retries INTEGER := 5;
    retry_count INTEGER := 0;
    success BOOLEAN := false;
BEGIN
    -- Attendre un peu pour que l'user soit bien créé dans auth.users
    PERFORM pg_sleep(0.05);
    
    -- Log pour debug
    RAISE NOTICE 'Tentative de création de profil pour user: %, rôle: %', 
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'role', 'agriculteur');
    
    -- Boucle de retry avec gestion d'erreur
    WHILE retry_count < max_retries AND NOT success LOOP
        BEGIN
            -- Tentative d'insertion
            INSERT INTO public.profiles (id, role, is_validated)
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'role', 'agriculteur')::user_role,
                COALESCE(NEW.raw_user_meta_data->>'role', 'agriculteur') != 'agriculteur'
            );
            
            success := true;
            RAISE NOTICE 'Profil créé avec succès pour user: %', NEW.id;
            
        EXCEPTION
            WHEN foreign_key_violation THEN
                retry_count := retry_count + 1;
                IF retry_count < max_retries THEN
                    RAISE NOTICE 'Retry % pour user: %', retry_count, NEW.id;
                    PERFORM pg_sleep(0.1 * retry_count); -- Attente progressive
                ELSE
                    RAISE EXCEPTION 'Échec création profil après % tentatives pour user: %', 
                        max_retries, NEW.id;
                END IF;
                
            WHEN undefined_object THEN  -- Gestion spécifique du type user_role
                RAISE EXCEPTION 'Type user_role non trouvé pour user: %', NEW.id;
                
            WHEN OTHERS THEN
                RAISE EXCEPTION 'Erreur inattendue pour user %: %', NEW.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$;
-- Recréer le déclencheur
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to update farmer count in cooperative
CREATE OR REPLACE FUNCTION public.update_cooperative_member_count()

RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.cooperative_id IS NOT NULL THEN
    UPDATE cooperative_profiles 
    SET members_count = members_count + 1 
    WHERE user_id = NEW.cooperative_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle cooperative change
    IF OLD.cooperative_id IS DISTINCT FROM NEW.cooperative_id THEN
      -- Decrease count for old cooperative
      IF OLD.cooperative_id IS NOT NULL THEN
        UPDATE cooperative_profiles 
        SET members_count = members_count - 1 
        WHERE user_id = OLD.cooperative_id;
      END IF;
      -- Increase count for new cooperative
      IF NEW.cooperative_id IS NOT NULL THEN
        UPDATE cooperative_profiles 
        SET members_count = members_count + 1 
        WHERE user_id = NEW.cooperative_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.cooperative_id IS NOT NULL THEN
    UPDATE cooperative_profiles 
    SET members_count = members_count - 1 
    WHERE user_id = OLD.cooperative_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for cooperative member count
CREATE TRIGGER on_farmer_cooperative_change
  AFTER INSERT OR UPDATE OR DELETE ON farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_cooperative_member_count();