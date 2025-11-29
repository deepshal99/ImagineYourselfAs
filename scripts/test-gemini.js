import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey || apiKey.includes('demo-key')) {
    console.error("❌ Invalid or missing API Key. Ensure .env file has a valid key and run with --env-file=.env");
    // Try to read .env manually as fallback if flag wasn't used
    // (omitted for brevity, expecting user/tool to run correctly)
}

if (!apiKey) {
     console.error("DEBUG: ENV VARS available:", Object.keys(process.env));
     process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const testGeneration = async () => {
    console.log("🚀 Testing Gemini 3 Pro Image Preview...");
    console.log(`Using Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'None'}`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [
                {
                    parts: [
                        { text: "Create a simple line drawing of a cat." }
                    ]
                }
            ],
            config: {
                imageConfig: {
                    imageSize: '1K',
                    aspectRatio: '1:1',
                    imageCount: 1
                }
            }
        });

        console.log("✅ Response Received!");
        
        if (response.candidates && response.candidates.length > 0) {
            console.log("Candidates:", response.candidates.length);
            const part = response.candidates[0].content.parts[0];
            if (part.inlineData) {
                console.log("✅ Image Data Found (Base64)");
            } else if (part.text) {
                console.log("⚠️ Text Received instead of Image:", part.text);
            } else {
                console.log("⚠️ Unknown Part Type:", part);
            }
        } else {
            console.log("❌ No candidates in response.");
            console.log(JSON.stringify(response, null, 2));
        }

    } catch (error) {
        console.error("❌ Generation Failed:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Status Text: ${error.response.statusText}`);
        }
        console.error(error.message);
    }
};

testGeneration();
