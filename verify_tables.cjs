const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env
let supabaseUrl = "";
let supabaseKey = "";

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
                    supabaseUrl = value;
                } else if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') {
                    supabaseKey = value;
                }
            }
        }
    }
} catch (e) {
    console.error("Error reading .env:", e.message);
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY not found in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log(`Checking connection to database: ${supabaseUrl}`);
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.log("Profiles Check Error: ", JSON.stringify(error, null, 2));
    } else {
        console.log("Profiles Check Success. Data length: " + data.length);
    }
}

checkTables();
