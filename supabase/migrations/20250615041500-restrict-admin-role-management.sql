
-- Update the toggle_admin_role function to only allow the specific super admin
CREATE OR REPLACE FUNCTION public.toggle_admin_role(_user_id uuid, _make_admin boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  _current_user_email text;
BEGIN
  -- Get the current user's email
  SELECT email INTO _current_user_email 
  FROM public.profiles 
  WHERE id = auth.uid();

  -- Check if the caller is the specific super admin
  IF _current_user_email != 'arthobala383@gmail.com' THEN
    RETURN json_build_object('success', false, 'message', 'Only the super admin can manage admin roles');
  END IF;

  IF _make_admin THEN
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Remove admin role
    DELETE FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin';
  END IF;

  RETURN json_build_object('success', true, 'message', 'Admin role updated successfully');
END;
$function$
