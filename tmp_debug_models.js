require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    try {
        console.log("Fetching models...");
        // get a generic model and call list models if SDK supports it, or raw fetch
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_AI_API_KEY}`);
        const data = await response.json();
        console.log("Available models:");
        if (data.models) {
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log(data);
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();
