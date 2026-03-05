-- Update the redeem_code function to handle duration-based subscriptions
CREATE OR REPLACE FUNCTION public.redeem_code(_code text, _user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _redeem_record record;
  _result json;
  _subscription_end timestamptz;
BEGIN
  -- Find the code and check if it's valid
  SELECT * INTO _redeem_record
  FROM public.redeem_codes
  WHERE code = _code
    AND NOT is_used
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid or expired code');
  END IF;
  
  -- Calculate subscription end date based on duration
  IF _redeem_record.duration_days IS NOT NULL THEN
    _subscription_end := now() + (_redeem_record.duration_days || ' days')::interval;
  ELSIF _redeem_record.duration_months IS NOT NULL THEN
    _subscription_end := now() + (_redeem_record.duration_months || ' months')::interval;
  ELSE
    -- Default to 1 month if no duration specified
    _subscription_end := now() + '1 month'::interval;
  END IF;
  
  -- Mark code as used
  UPDATE public.redeem_codes
  SET is_used = true,
      used_by = _user_id,
      used_at = now()
  WHERE id = _redeem_record.id;
  
  -- Update user's plan with subscription end date
  UPDATE public.profiles
  SET plan = _redeem_record.plan_type,
      updated_at = now()
  WHERE id = _user_id;
  
  -- Create or update subscription record (assuming we need a subscription table)
  INSERT INTO public.user_subscriptions (user_id, plan_type, subscription_end, created_at)
  VALUES (_user_id, _redeem_record.plan_type, _subscription_end, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    plan_type = EXCLUDED.plan_type,
    subscription_end = EXCLUDED.subscription_end,
    updated_at = now();
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Code redeemed successfully',
    'plan', _redeem_record.plan_type,
    'subscription_end', _subscription_end
  );
END;
$$;

-- Create user_subscriptions table to track subscription durations
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL,
  subscription_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (user_id = auth.uid());

-- Create policy for system to manage subscriptions
CREATE POLICY "System can manage subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (true);

-- Create function to generate redeem codes with duration
CREATE OR REPLACE FUNCTION public.generate_redeem_code(
  _code text,
  _plan_type text,
  _duration_days integer DEFAULT NULL,
  _duration_months integer DEFAULT NULL,
  _expires_at timestamptz DEFAULT (now() + '1 year'::interval)
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Insert the redeem code
  INSERT INTO public.redeem_codes (
    code, 
    plan_type, 
    duration_days, 
    duration_months, 
    expires_at, 
    created_by
  )
  VALUES (
    _code, 
    _plan_type, 
    _duration_days, 
    _duration_months, 
    _expires_at, 
    auth.uid()
  );

  RETURN json_build_object(
    'success', true, 
    'message', 'Redeem code generated successfully',
    'code', _code,
    'plan_type', _plan_type,
    'duration_days', _duration_days,
    'duration_months', _duration_months
  );
END;
$$;