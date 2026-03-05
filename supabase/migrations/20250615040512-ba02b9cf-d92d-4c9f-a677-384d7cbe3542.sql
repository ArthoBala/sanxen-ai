
-- First, completely drop ALL existing policies on user_roles table
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT pol.polname 
        FROM pg_policy pol 
        JOIN pg_class cls ON pol.polrelid = cls.oid 
        JOIN pg_namespace ns ON cls.relnamespace = ns.oid 
        WHERE ns.nspname = 'public' AND cls.relname = 'user_roles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', policy_name);
    END LOOP;
END $$;

-- Now create the new policies
-- Allow users to view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- Allow service role to manage all roles (for admin functions)
CREATE POLICY "Service role can manage all roles" ON public.user_roles
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to view all roles (needed for admin checks)
CREATE POLICY "Authenticated users can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (true);

-- Only allow inserts/updates/deletes through the RPC functions
CREATE POLICY "Only RPC functions can modify roles" ON public.user_roles
FOR INSERT WITH CHECK (false);

CREATE POLICY "Only RPC functions can update roles" ON public.user_roles
FOR UPDATE USING (false);

CREATE POLICY "Only RPC functions can delete roles" ON public.user_roles
FOR DELETE USING (false);
