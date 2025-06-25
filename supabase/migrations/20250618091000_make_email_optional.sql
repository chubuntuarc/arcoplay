-- Make email field optional for WhatsApp users
-- This allows users to register with phone only

-- First, let's check if there are any existing users with NULL email
-- If so, we'll update them to have a placeholder email
UPDATE users 
SET email = 'user_' || id || '@arcoplay.local' 
WHERE email IS NULL;

-- Drop existing unique constraints if they exist
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Now make the email column nullable
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Add a check constraint to ensure at least one of email or phone is provided
ALTER TABLE public.users ADD CONSTRAINT users_email_or_phone_check 
CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Create unique constraints only for non-null values
CREATE UNIQUE INDEX users_email_unique ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX users_phone_unique ON users(phone) WHERE phone IS NOT NULL; 