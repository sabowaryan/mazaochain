-- Migration for creating demo profiles with real account IDs
-- Based on actual users created in the database

-- Create demo profiles using real account IDs from Gmail accounts
DO $$
BEGIN
  -- Create base profiles for existing users (using real Gmail account IDs)
  INSERT INTO profiles (
    id,
    role,
    wallet_address,
    is_validated
  ) VALUES 
  (
    '59a49ff8-282d-4d0a-83ab-d2a88831fad1',
    'agriculteur',
    NULL,
    FALSE
  ),
  (
    '921f8859-9ce9-4230-b5f3-0762f3bde39b',
    'cooperative',
    NULL,
    TRUE
  ),
  (
    '1a74d7d6-3e67-448e-8a40-b4808fcf1eff',
    'preteur',
    NULL,
    TRUE
  ) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    wallet_address = EXCLUDED.wallet_address,
    is_validated = EXCLUDED.is_validated;
  
  RAISE NOTICE 'Real demo profiles updated successfully';
END $$;

-- Create detailed farmer profiles with all required fields
DO $$
BEGIN
  -- Create farmer profile for Gmail farmer account
  INSERT INTO farmer_profiles (
    user_id,
    nom,
    superficie,
    localisation,
    cooperative_id,
    crop_type,
    rendement_historique,
    experience_annees
  ) VALUES (
    '59a49ff8-282d-4d0a-83ab-d2a88831fad1',
    'Pierre Kasongo',
    3.2,
    'Kinshasa, Kimbanseke',
    '921f8859-9ce9-4230-b5f3-0762f3bde39b',
    'manioc',
    7500.0,
    3
  ) ON CONFLICT (user_id) DO UPDATE SET
    nom = EXCLUDED.nom,
    superficie = EXCLUDED.superficie,
    localisation = EXCLUDED.localisation,
    cooperative_id = EXCLUDED.cooperative_id,
    crop_type = EXCLUDED.crop_type,
    rendement_historique = EXCLUDED.rendement_historique,
    experience_annees = EXCLUDED.experience_annees;
  
  RAISE NOTICE 'Farmer profiles created successfully';
END $$;

-- Create cooperative profile
DO $$
BEGIN
  INSERT INTO cooperative_profiles (
    user_id,
    nom,
    region,
    members_count
  ) VALUES (
    '921f8859-9ce9-4230-b5f3-0762f3bde39b',
    'COPAKI Kinshasa',
    'Kinshasa',
    1
  ) ON CONFLICT (user_id) DO UPDATE SET
    nom = EXCLUDED.nom,
    region = EXCLUDED.region,
    members_count = EXCLUDED.members_count;
  
  RAISE NOTICE 'Cooperative profile created successfully';
END $$;

-- Create lender profile
DO $$
BEGIN
  INSERT INTO lender_profiles (
    user_id,
    institution_name,
    available_funds
  ) VALUES (
    '1a74d7d6-3e67-448e-8a40-b4808fcf1eff',
    'FinanceRDC',
    75000.00
  ) ON CONFLICT (user_id) DO UPDATE SET
    institution_name = EXCLUDED.institution_name,
    available_funds = EXCLUDED.available_funds;
  
  RAISE NOTICE 'Lender profile created successfully';
END $$;

-- Create sample crop evaluations for the Gmail farmer account
DO $$
BEGIN
  INSERT INTO crop_evaluations (
    farmer_id,
    crop_type,
    superficie,
    rendement_historique,
    prix_reference,
    valeur_estimee,
    status
  ) VALUES 
  (
    '59a49ff8-282d-4d0a-83ab-d2a88831fad1',
    'manioc',
    3.0,
    8000.0,
    0.5,
    12000.0,
    'approved'
  ),
  (
    '59a49ff8-282d-4d0a-83ab-d2a88831fad1',
    'cafe',
    2.5,
    1200.0,
    2.5,
    7500.0,
    'pending'
  ) ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample crop evaluations created successfully';
END $$;

-- Create sample loan for the Gmail farmer account
DO $$
BEGIN
  INSERT INTO loans (
    borrower_id,
    lender_id,
    principal,
    collateral_amount,
    interest_rate,
    due_date,
    status
  ) VALUES (
    '59a49ff8-282d-4d0a-83ab-d2a88831fad1',
    '1a74d7d6-3e67-448e-8a40-b4808fcf1eff',
    5000.00,
    12000.00,
    0.15,
    NOW() + INTERVAL '6 months',
    'active'
  ) ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample loan created successfully';
END $$;

-- Create sample transactions
DO $$
BEGIN
  INSERT INTO transactions (
    user_id,
    transaction_type,
    from_address,
    to_address,
    amount,
    token_type,
    hedera_transaction_id,
    status
  ) VALUES 
  (
    '59a49ff8-282d-4d0a-83ab-d2a88831fad1',
    'mint',
    NULL,
    '0.0.123456',
    12000.00,
    'MAZAO',
    '0.0.123456@1640995200.123456789',
    'confirmed'
  ),
  (
    '1a74d7d6-3e67-448e-8a40-b4808fcf1eff',
    'loan',
    '0.0.789012',
    '0.0.123456',
    5000.00,
    'USDC',
    '0.0.789012@1640995300.987654321',
    'confirmed'
  ) ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Sample transactions created successfully';
END $$;

-- Create notification preferences for all demo accounts
DO $$
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    email_enabled,
    sms_enabled,
    in_app_enabled
  ) VALUES 
  (
    '59a49ff8-282d-4d0a-83ab-d2a88831fad1',
    TRUE,
    FALSE,
    TRUE
  ),
  (
    '921f8859-9ce9-4230-b5f3-0762f3bde39b',
    TRUE,
    TRUE,
    TRUE
  ),
  (
    '1a74d7d6-3e67-448e-8a40-b4808fcf1eff',
    TRUE,
    FALSE,
    TRUE
  ) ON CONFLICT (user_id) DO UPDATE SET
    email_enabled = EXCLUDED.email_enabled,
    sms_enabled = EXCLUDED.sms_enabled,
    in_app_enabled = EXCLUDED.in_app_enabled;
  
  RAISE NOTICE 'Notification preferences created successfully';
  RAISE NOTICE '🎉 SUCCESS: All real demo data has been created!';
  RAISE NOTICE 'Farmer account: 59a49ff8-282d-4d0a-83ab-d2a88831fad1 (mazao.farmer.demo@gmail.com)';
  RAISE NOTICE 'Cooperative account: 921f8859-9ce9-4230-b5f3-0762f3bde39b (mazao.cooperative.demo@gmail.com)';
  RAISE NOTICE 'Lender account: 1a74d7d6-3e67-448e-8a40-b4808fcf1eff (mazao.lender.demo@gmail.com)';
END $$;