const SUPABASE_URL = "https://uafvpivxhczysagteaod.supabase.co";
const SUPABASE_KEY = "sb_publishable_SyXpIOzFGD516Y1WwBWeZw_tXXvnl6i";

const { createClient } = supabase;

const db = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);