const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const outputFile = path.join(__dirname, 'supabase_setup.sql');

try {
    if (!fs.existsSync(migrationsDir)) {
        console.error("Migrations directory not found at " + migrationsDir);
        process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Alphabetic sorting sorts them in chronological order of timestamps

    console.log(`Found ${files.length} migration files. Concatenating...`);

    let consolidatedSql = `-- CONSOLIDATED SUPABASE SCHEMA SETUP\n`;
    consolidatedSql += `-- Generated on ${new Date().toISOString()}\n\n`;

    for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        consolidatedSql += `-- ==========================================\n`;
        consolidatedSql += `-- MIGRATION: ${file}\n`;
        consolidatedSql += `-- ==========================================\n\n`;
        consolidatedSql += fileContent;
        consolidatedSql += `\n\n`;
    }

    fs.writeFileSync(outputFile, consolidatedSql, 'utf-8');
    console.log(`Successfully generated consolidated schema at: ${outputFile}`);

} catch (error) {
    console.error("Failed to consolidate migrations:", error.message);
}
