// ==============================
// Supabase холболтын тохиргоо
// ==============================
// Доорх утгуудыг өөрийн Supabase төслийн Settings > API хэсгээс аваад тавина
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Supabase клиент үүсгэх (supabase-js CDN скрипт HTML дотор эхэлж холбогдсон байх ёстой)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);