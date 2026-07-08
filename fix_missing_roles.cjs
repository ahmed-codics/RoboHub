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

async function fixRoles() {
    console.log(`Connecting to database to fix missing roles...`);
    
    // 1. Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name');
        
    if (profilesError) {
        console.error("Error fetching profiles:", profilesError.message);
        return;
    }
    
    console.log(`Found ${profiles.length} profiles. Checking their roles...`);
    
    for (const profile of profiles) {
        // Check if role exists
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .maybeSingle();
            
        if (roleError) {
            console.error(`Error checking role for user ${profile.name}:`, roleError.message);
            continue;
        }
        
        if (!roleData) {
            console.log(`User "${profile.name}" (${profile.id}) is missing a role. Inserting 'freelancer' role...`);
            
            // Insert freelancer role
            const { error: insertError } = await supabase
                .from('user_roles')
                .upsert({
                    user_id: profile.id,
                    role: 'freelancer'
                });
                
            if (insertError) {
                console.error(`Failed to insert role for ${profile.name}:`, insertError.message, JSON.stringify(insertError));
            } else {
                console.log(`Successfully assigned 'freelancer' role to "${profile.name}"!`);
            }
        } else {
            console.log(`User "${profile.name}" already has role: ${roleData.role}`);
        }
    }
    
    console.log("Role verification and fix complete!");
}

fixRoles();
