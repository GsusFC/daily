const { Client } = require("@notionhq/client");
require('dotenv').config({ path: '.env.local' });

async function checkNotion() {
    const token = process.env.NOTION_TOKEN;
    // Support both singular and plural variables
    const dbIdsString = process.env.NOTION_DATABASE_IDS || process.env.NOTION_DATABASE_ID || "";
    // Take the first ID found for testing
    const dbId = dbIdsString.split(',')[0].trim();

    if (!token || !dbId) {
        console.error("Missing NOTION_TOKEN or NOTION_DATABASE_ID(S) in .env.local");
        return;
    }

    const notion = new Client({ auth: token });

    console.log(`Checking Database ID: ${dbId}`);

    try {
        // 1. Retrieve Database Metadata to check properties
        console.log("1. Fetching Database Metadata...");
        const db = await notion.databases.retrieve({ database_id: dbId });
        console.log("✅ Database found!");
        // Log the FULL object to see what we are dealing with
        console.log("DEBUG: Full Object from Notion:");
        console.log(JSON.stringify(db, null, 2));

        if (db.properties) {
            console.log("Properties found:", Object.keys(db.properties).join(", "));

            // Check if 'Status' property exists
            if (db.properties["Status"]) {
                console.log("✅ Property 'Status' exists.");
                console.log("Type:", db.properties["Status"].type);
            } else {
                console.error("❌ Property 'Status' NOT found.");
            }
        } else {
            console.error("❌ No properties found in database metadata.");
        }

        // 2. Query without filters (fetch first 5 items)
        console.log("\n2. Querying first 5 items (no filters)...");
        const response = await notion.databases.query({
            database_id: dbId,
            page_size: 5
        });

        console.log(`Found ${response.results.length} items.`);
        if (response.results.length > 0) {
            const firstItem = response.results[0];
            // Try to find the Status property value
            const props = firstItem.properties;
            console.log("Sample Item Properties:");
            for (const [key, value] of Object.entries(props)) {
                if (value.type === 'status') {
                    console.log(`- ${key}: ${value.status?.name}`);
                } else if (value.type === 'select') {
                    console.log(`- ${key}: ${value.select?.name}`);
                }
            }
        } else {
            console.log("⚠️ Database is empty or bot has no access to items.");
        }

    } catch (error) {
        console.error("❌ Error accessing Notion:", error.message);
        if (error.code === 'object_not_found') {
            console.error("💡 Hint: Make sure you have invited the Integration to the Database page in Notion (3 dots > Connect to > Your Integration).");
        }
    }
}

checkNotion();
