
-- Fix the get_usage function to handle null values properly
CREATE OR REPLACE FUNCTION public.get_usage(_user_id uuid, _feature_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _current_count integer := 0;
  _user_plan text;
  _daily_limit integer;
BEGIN
  -- Get user's plan
  SELECT COALESCE(plan, 'free') INTO _user_plan FROM public.profiles WHERE id = _user_id;
  
  -- Set daily limits based on plan and feature
  CASE _feature_type
    WHEN 'image_generation' THEN
      CASE _user_plan
        WHEN 'free' THEN _daily_limit := 5;
        WHEN 'pro' THEN _daily_limit := 10;
        WHEN 'plus' THEN _daily_limit := 20;
        ELSE _daily_limit := 5;
      END CASE;
    WHEN 'image_analysis' THEN
      CASE _user_plan
        WHEN 'free' THEN _daily_limit := 10;
        WHEN 'pro' THEN _daily_limit := 20;
        WHEN 'plus' THEN _daily_limit := 30;
        ELSE _daily_limit := 10;
      END CASE;
    WHEN 'video_analysis' THEN
      CASE _user_plan
        WHEN 'free' THEN _daily_limit := 3;
        WHEN 'pro' THEN _daily_limit := 10;
        WHEN 'plus' THEN _daily_limit := 20;
        ELSE _daily_limit := 3;
      END CASE;
    ELSE
      RETURN json_build_object('success', false, 'message', 'Invalid feature type');
  END CASE;

  -- Get current usage for today, ensuring we never get null
  SELECT COALESCE(count, 0) INTO _current_count 
  FROM public.user_usage 
  WHERE user_id = _user_id 
    AND feature_type = _feature_type 
    AND usage_date = CURRENT_DATE;

  -- Ensure _current_count is never null
  _current_count := COALESCE(_current_count, 0);

  RETURN json_build_object(
    'success', true,
    'current_count', _current_count,
    'daily_limit', _daily_limit,
    'plan', _user_plan,
    'remaining', _daily_limit - _current_count
  );
END;
$$;
