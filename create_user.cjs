
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://hncbyqjxfwbwoblhcokz.supabase.co";
const supabaseKey = "sb_publishable_UTj_WcR1JomV8Z7X8Y2TaQ_Wxta7EwT";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
    const email = "paymob_tester@gmail.com";
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
    // We can try to insert profile, if it fails due to duplicates it's fine.
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
