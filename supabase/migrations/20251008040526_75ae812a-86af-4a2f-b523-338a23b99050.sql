-- Remove the insecure INSERT policy that allows any user to create audit logs
DROP POLICY IF EXISTS "Users can create audit logs" ON public.audit_logs;

-- Create a secure function to insert audit logs (server-side only)
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  -- Only allow logged-in users to create audit logs
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create audit logs';
  END IF;
  
  -- Insert the audit log with the authenticated user's ID
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    v_user_id,  -- Always use the authenticated user's ID
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.insert_audit_log TO authenticated;