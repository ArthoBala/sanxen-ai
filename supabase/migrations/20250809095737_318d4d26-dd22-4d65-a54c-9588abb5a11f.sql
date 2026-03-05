-- Fix the increment_usage function with proper syntax
CREATE OR REPLACE FUNCTION public.increment_usage(_user_id uuid, _feature_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  _current_count integer;
  _user_plan text;
  _daily_limit integer;
BEGIN
  -- Get user's plan
  SELECT plan INTO _user_plan FROM public.profiles WHERE id = _user_id;
  
  -- Set daily limits based on plan and feature
  CASE _feature_type
    WHEN 'text_generation' THEN
      CASE _user_plan
        WHEN 'free' THEN _daily_limit := 50;
        WHEN 'pro' THEN _daily_limit := 200;
        WHEN 'plus' THEN _daily_limit := 500;
        ELSE _daily_limit := 50; -- default to free
      END CASE;
    WHEN 'image_generation' THEN
      CASE _user_plan
        WHEN 'free' THEN _daily_limit := 5;
        WHEN 'pro' THEN _daily_limit := 10;
        WHEN 'plus' THEN _daily_limit := 20;
        ELSE _daily_limit := 5; -- default to free
      END CASE;
    WHEN 'image_analysis' THEN
      CASE _user_plan
        WHEN 'free' THEN _daily_limit := 10;
        WHEN 'pro' THEN _daily_limit := 20;
        WHEN 'plus' THEN _daily_limit := 30;
        ELSE _daily_limit := 10; -- default to free
      END CASE;
    WHEN 'video_analysis' THEN
      CASE _user_plan
        WHEN 'free' THEN _daily_limit := 3;
        WHEN 'pro' THEN _daily_limit := 10;
        WHEN 'plus' THEN _daily_limit := 20;
        ELSE _daily_limit := 3; -- default to free
      END CASE;
    ELSE
      RETURN json_build_object('success', false, 'message', 'Invalid feature type');
  END CASE;

  -- Get current usage for today
  SELECT count INTO _current_count 
  FROM public.user_usage 
  WHERE user_id = _user_id 
    AND feature_type = _feature_type 
    AND usage_date = CURRENT_DATE;

  -- Check if user has exceeded limit
  IF _current_count >= _daily_limit THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Daily limit exceeded',
      'current_count', _current_count,
      'daily_limit', _daily_limit,
      'plan', _user_plan
    );
  END IF;

  -- Increment usage counter or create new record
  INSERT INTO public.user_usage (user_id, feature_type, usage_date, count)
  VALUES (_user_id, _feature_type, CURRENT_DATE, 1)
  ON CONFLICT (user_id, feature_type, usage_date)
  DO UPDATE SET 
    count = user_usage.count + 1,
    updated_at = now();

  -- Return success with updated count
  SELECT count INTO _current_count 
  FROM public.user_usage 
  WHERE user_id = _user_id 
    AND feature_type = _feature_type 
    AND usage_date = CURRENT_DATE;

  RETURN json_build_object(
    'success', true,
    'current_count', _current_count,
    'daily_limit', _daily_limit,
    'plan', _user_plan
  );
END;
$function$