const { Client } = require("@notionhq/client");
require('dotenv').config({ path: '.env.local' });

async function listDatabases() {
    const token = process.env.NOTION_TOKEN;
    if (!token) {
        console.error("❌ Missing NOTION_TOKEN in .env.local");
        return;
    }

    const notion = new Client({ auth: token });

    console.log("🔍 Searching for databases accessible to the integration...");

    try {
        const response = await notion.search({
            sort: {
                direction: 'descending',
                timestamp: 'last_edited_time'
            }
        });

        const databases = response.results.filter(item => item.object === 'database');

        if (databases.length === 0) {
            console.log("⚠️ No databases found. Make sure you have invited the integration to a database page.");
        } else {
            console.log(`✅ Found ${databases.length} databases:\n`);
            databases.forEach(db => {
                const title = db.title && db.title.length > 0 ? db.title[0].plain_text : "Untitled";
                console.log(`Name: "${title}"`);
                console.log(`ID:   ${db.id}`);
                console.log(`URL:  ${db.url}`);
                if (db.properties) {
                    console.log(`Properties: ${Object.keys(db.properties).join(', ')}`);
                }
                console.log("---------------------------------------------------");
            });
        }

    } catch (error) {
        console.error("❌ Error searching Notion:", error.message);
    }
}

listDatabases();
