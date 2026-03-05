
-- Update the check constraint on profiles table to allow 'plus' plan
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_plan_check 
CHECK (plan IN ('free', 'pro', 'plus'));
