import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateMCQs = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    let content = response.choices[0].message.content?.trim();

    if (!content) {
      throw new Error("Empty response from OpenAI.");
    }

    const match = content.match(/\[\s*{[\s\S]*}\s*]/);
    if (!match) {
      console.error(
        "❌ Could not find valid JSON array in response:\n",
        content
      );
      throw new Error("OpenAI returned invalid JSON format.");
    }

    try {
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) {
        throw new Error("Parsed content is not an array.");
      }
      return parsed;
    } catch (parseErr) {
      console.error("❌ Failed to parse OpenAI response:\n", match[0]);
      throw new Error("OpenAI returned invalid JSON format.");
    }
  } catch (err) {
    console.error("❌ OpenAI API Error:", err.message);
    throw err;
  }
};

export default generateMCQs;
