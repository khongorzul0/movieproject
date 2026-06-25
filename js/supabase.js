// ==============================
// Supabase холболтын тохиргоо
// ==============================
// Доорх утгуудыг өөрийн Supabase төслийн Settings > API хэсгээс аваад тавина
const SUPABASE_URL = "https://bwcebgotiazvhubbusgn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tjTkMOKBnicV6gCFY4tc-A_u9OtTxC6";

// Supabase клиент үүсгэх (supabase-js CDN скрипт HTML дотор эхэлж холбогдсон байх ёстой)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);