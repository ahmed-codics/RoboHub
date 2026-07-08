const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env
let url1 = "";
let key1 = "";

try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                // Remove quotes
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.substring(1, value.length - 1);
                }
                if (key === 'VITE_SUPABASE_URL') {
                    url1 = value;
                } else if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') {
                    key1 = value;
                }
            }
        }
    }
} catch (e) {
    console.error("Error reading .env:", e.message);
}

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
