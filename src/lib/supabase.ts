import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://nmsvxutbuikyopliigki.supabase.co"; 
const supabaseAnonKey = "sb_publishable_ztZ2GpQgWojE5uihnoQJuA__Gbjofag";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);