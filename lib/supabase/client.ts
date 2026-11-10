import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bsspsgukpzgsgwjwnidv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_NJ60mEw_wan22TC2baqzmA_y9lQMsya";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
