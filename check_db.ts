
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { config } from "https://deno.land/x/dotenv/mod.ts";

const supabaseUrl = "https://hncbyqjxfwbwoblhcokz.supabase.co";
const supabaseKey = "sb_publishable_UTj_WcR1JomV8Z7X8Y2TaQ_Wxta7EwT";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
        console.log("Error:", error.message);
    } else {
        console.log("Success: Profiles table exists.");
    }
}

check();
