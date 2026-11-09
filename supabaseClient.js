// تهيئة Supabase بالطريقة المتوافقة مع Modules والوضع العادي
const SUPABASE_URL = 'https://kdmlkhlceihidcmwdhxi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G5uoFE-wczB6h1YeBAt__g_0ktNTptG';

// إنشاء الكلاينت وتصديره كـ Module
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// وحفظه أيضاً كمتغير عام للاستخدام المباشر في باقي الصفحات
window.supabaseClientInstance = supabase;