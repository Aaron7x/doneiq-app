// supabase-ping.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' }); // Ensure it reads your prod env variables

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.production");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function pingDatabase() {
  try {
    console.log(`[${new Date().toISOString()}] Pinging Supabase...`);
    
    // A simple query to register read activity
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (error) throw error;
    
    console.log(`[${new Date().toISOString()}] Ping successful. Database is active.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Ping failed:`, error.message);
  }
}

pingDatabase();