-- Create notification preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  channels JSONB DEFAULT '{
    "registration_pending": ["in_app", "email"],
    "registration_approved": ["in_app", "email"],
    "registration_rejected": ["in_app", "email"],
    "evaluation_submitted": ["in_app"],
    "evaluation_approved": ["in_app", "email"],
    "evaluation_rejected": ["in_app", "email"],
    "loan_requested": ["in_app"],
    "loan_approved": ["in_app", "email", "sms"],
    "loan_rejected": ["in_app", "email"],
    "loan_disbursed": ["in_app", "email", "sms"],
    "repayment_due": ["in_app", "email", "sms"],
    "repayment_overdue": ["in_app", "email", "sms"],
    "repayment_completed": ["in_app", "email"],
    "collateral_released": ["in_app", "email"],
    "system_maintenance": ["in_app", "email"],
    "security_alert": ["in_app", "email", "sms"]
  }'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add phone_number and email to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Add data column to notifications table if not exists
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- Create function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create notification preferences for new users
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();