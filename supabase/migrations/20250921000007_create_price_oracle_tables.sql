-- Create price oracle tables for manual price management and history tracking

-- Price sources enum
CREATE TYPE price_source AS ENUM ('manual', 'chainlink', 'external_api');

-- Crop prices table for current and historical prices
CREATE TABLE crop_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type TEXT NOT NULL CHECK (crop_type IN ('manioc', 'cafe')),
  price DECIMAL(10,4) NOT NULL CHECK (price > 0),
  currency TEXT NOT NULL DEFAULT 'USDC',
  source price_source NOT NULL DEFAULT 'manual',
  source_reference TEXT, -- Reference to external source if applicable
  updated_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price history for trend analysis
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type TEXT NOT NULL CHECK (crop_type IN ('manioc', 'cafe')),
  price DECIMAL(10,4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDC',
  source price_source NOT NULL,
  source_reference TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price update notifications
CREATE TABLE price_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type TEXT NOT NULL CHECK (crop_type IN ('manioc', 'cafe')),
  old_price DECIMAL(10,4),
  new_price DECIMAL(10,4) NOT NULL,
  price_change_percent DECIMAL(5,2),
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_crop_prices_type_active ON crop_prices(crop_type, is_active);
CREATE INDEX idx_crop_prices_updated_at ON crop_prices(updated_at DESC);
CREATE INDEX idx_price_history_crop_recorded ON price_history(crop_type, recorded_at DESC);
CREATE INDEX idx_price_notifications_sent ON price_notifications(notification_sent, created_at);

-- RLS policies
ALTER TABLE crop_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_notifications ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read prices
CREATE POLICY "Allow authenticated users to read crop prices" ON crop_prices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read price history" ON price_history
  FOR SELECT TO authenticated USING (true);

-- Only admin and cooperative users can update prices
CREATE POLICY "Allow admin and cooperative to update prices" ON crop_prices
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'cooperative')
    )
  );

-- Only admin and cooperative users can insert price history
CREATE POLICY "Allow admin and cooperative to insert price history" ON price_history
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'cooperative')
    )
  );

-- Allow system to manage price notifications
CREATE POLICY "Allow system to manage price notifications" ON price_notifications
  FOR ALL TO authenticated USING (true);

-- Function to automatically archive old prices to history
CREATE OR REPLACE FUNCTION archive_price_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert old price into history when price is updated
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO price_history (crop_type, price, currency, source, source_reference, recorded_at)
    VALUES (OLD.crop_type, OLD.price, OLD.currency, OLD.source, OLD.source_reference, OLD.updated_at);
    
    -- Create notification record
    INSERT INTO price_notifications (crop_type, old_price, new_price, price_change_percent)
    VALUES (
      NEW.crop_type, 
      OLD.price, 
      NEW.price,
      ROUND(((NEW.price - OLD.price) / OLD.price * 100)::numeric, 2)
    );
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to archive prices on update
CREATE TRIGGER trigger_archive_price_update
  BEFORE UPDATE ON crop_prices
  FOR EACH ROW
  EXECUTE FUNCTION archive_price_update();

-- Insert default prices
INSERT INTO crop_prices (crop_type, price, source, updated_by) VALUES
  ('manioc', 0.5, 'manual', NULL),
  ('cafe', 2.0, 'manual', NULL);