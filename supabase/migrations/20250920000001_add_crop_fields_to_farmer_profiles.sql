-- Add crop information fields to farmer_profiles table
ALTER TABLE farmer_profiles 
ADD COLUMN crop_type TEXT CHECK (crop_type IN ('manioc', 'cafe')),
ADD COLUMN rendement_historique DECIMAL CHECK (rendement_historique > 0),
ADD COLUMN experience_annees INTEGER CHECK (experience_annees >= 0);

-- Update existing records to have default values (optional, can be removed if no existing data)
UPDATE farmer_profiles 
SET crop_type = 'manioc', 
    rendement_historique = 1000, 
    experience_annees = 1 
WHERE crop_type IS NULL;

-- Make the new fields required for future inserts
ALTER TABLE farmer_profiles 
ALTER COLUMN crop_type SET NOT NULL,
ALTER COLUMN rendement_historique SET NOT NULL,
ALTER COLUMN experience_annees SET NOT NULL;