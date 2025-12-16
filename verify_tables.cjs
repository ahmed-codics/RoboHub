
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://hncbyqjxfwbwoblhcokz.supabase.co";
const supabaseKey = "sb_publishable_UTj_WcR1JomV8Z7X8Y2TaQ_Wxta7EwT";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    // Try to insert a dummy row into a non-existent table to force an error listing tables? No.
    // We can try to select from profiles again, logging the full error.
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.log("Profiles Check Error: ", JSON.stringify(error, null, 2));
    } else {
        console.log("Profiles Check Success. Data length: " + data.length);
    }
}

checkTables();
