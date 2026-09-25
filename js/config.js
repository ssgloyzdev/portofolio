// ==== KONFIGURASI — isi sesuai project Supabase kamu ====
const SUPABASE_URL = "https://khlzjpfatevjtkiziyok.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3lbPrS7vhOzJpDwstP5jGg_zet-o9e5";

// Redirect setelah login GitHub (biasanya sama dengan URL situs kamu)
const SITE_URL = window.location.origin + window.location.pathname;

// Query param pemulihan darurat: buka situs dengan ?showlogin=1
// untuk memaksa tombol login tetap tampil walau di database status
// login_hidden = true (berguna kalau kamu terlanjur logout & terkunci).
const RECOVERY_PARAM = "showlogin";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
