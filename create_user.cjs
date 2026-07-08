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

async function createUser() {
    console.log(`Connecting to: ${supabaseUrl}`);
    const email = "paymobtester@gmail.com";
    const password = "password123";

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.log("SignUp Error: " + error.message);
        if (error.message.includes("registered")) {
            console.log("User already exists, proceeding matches.");
        } else {
            return;
        }
    } else {
        console.log("SignUp Success: " + data.user?.id);
    }

    // 2. Create Profile (if not triggered automatically)
    if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: data.user.id,
            name: "Test Paymob User"
        });
        if (profileError) console.log("Profile Error: " + profileError.message);
        else console.log("Profile Success");

        const { error: roleError } = await supabase.from("user_roles").upsert({
            user_id: data.user.id,
            role: "freelancer"
        });
        if (roleError) console.log("Role Error: " + roleError.message);
        else console.log("Role Success");
    }
}

createUser();
