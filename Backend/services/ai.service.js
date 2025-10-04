// services/ai.service.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.4,
  },
  systemInstruction: `You are an expert in MERN and Development. You have an experience of 10 years in the development. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions.
    
Examples: 

<example>
response: {
  "text": "this is your fileTree structure of the express server",
  "fileTree": {
    "app.js": {
      "file": {
        "contents": "const express = require('express'); const app = express();

          app.get('/', (req, res) => {
              res.send('Hello World!');
          });

          app.listen(3000, () => {
              console.log('Server is running on port 3000');
          });"
      }
    },
    "package.json": {
      "file": {
        "contents": "{ \\"name\\": \\"temp-server\\", \\"version\\": \\"1.0.0\\", ... }"
      }
    }
  },
  "buildCommand": { "mainItem": "npm", "commands": ["install"] },
  "startCommand": { "mainItem": "node", "commands": ["app.js"] }
}
user: Create an express application
</example>

<example>
user: Hello
response: { "text": "Hello, How can I help you today?" }
</example>

IMPORTANT : don't use file name like routes/index.js
`
});

// ✅ Extract, parse, and gracefully fallback
export const generateResult = async (prompt, retries = 2) => {
  try {
    const result = await model.generateContent(prompt);

    const rawText =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return { text: "No response from AI." };
    }

    try {
      return JSON.parse(rawText);
    } catch {
      return { text: rawText };
    }
  } catch (error) {
    console.error("AI error:", error);

    // Retry if Gemini is overloaded
    if (retries > 0 && error.status === 503) {
      console.log(`Retrying... attempts left: ${retries - 1}`);
      await new Promise((res) => setTimeout(res, 1500));
      return generateResult(prompt, retries - 1);
    }

    return { text: "⚠️ AI service unavailable. Try again later." };
  }
};
