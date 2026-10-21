REVOKE ALL ON TABLE public.properties FROM anon, authenticated;
GRANT ALL ON TABLE public.properties TO service_role;
NOTIFY pgrst, 'reload schema';
