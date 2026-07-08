const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env
dotenv.config();

const url1 = process.env.VITE_SUPABASE_URL;
const key1 = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const url2 = "https://hncbyqjxfwbwoblhcokz.supabase.co";
const key2 = "sb_publishable_UTj_WcR1JomV8Z7X8Y2TaQ_Wxta7EwT";

async function testSupabase(name, url, key) {
    console.log(`Testing ${name}: ${url}`);
    if (!url || !key) {
        console.log(`Missing url or key for ${name}`);
        return;
    }
    const supabase = createClient(url, key);
    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`Error on ${name}:`, error.message, JSON.stringify(error));
        } else {
            console.log(`Success on ${name}! Head count success.`);
        }
    } catch (e) {
        console.log(`Exception on ${name}:`, e.message);
    }
}

async function run() {
    await testSupabase(".env credentials", url1, key1);
    await testSupabase("verify_tables.cjs credentials", url2, key2);
}

run();
