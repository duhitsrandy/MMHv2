require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get the Supabase URL and key from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if the environment variables are loaded
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Supabase URL or Anon Key not found in environment variables.');
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.');
  process.exit(1); // Exit the script if variables are missing
}

async function testSupabase() {
  try {
    console.log('Creating Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('Testing connection...');
    // Since we don't have any tables yet, let's just check if we can connect
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Connected successfully!');
      console.log('Session:', data);
      
      // Let's also update our .env.local file with the Supabase URL and key
      console.log('\nAdd these to your .env.local file:');
      console.log('NEXT_PUBLIC_SUPABASE_URL=' + SUPABASE_URL);
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=' + SUPABASE_KEY);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSupabase(); 