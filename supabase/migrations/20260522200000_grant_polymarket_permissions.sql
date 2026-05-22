-- Grant service_role access to polymarket tables
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON public.polymarket_bot_settings TO service_role;
GRANT ALL PRIVILEGES ON public.polymarket_trades TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Also grant anon read access
GRANT SELECT ON public.polymarket_trades TO anon;
