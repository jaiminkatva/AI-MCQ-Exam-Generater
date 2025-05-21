import Exam from "../model/Exam.js";
import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

// Sample MCQs from jsonData
// const jsonData = [
//   {
//     question:
//       "In Mongoose, which method is used to populate associated documents referenced in a schema?",
//     options: ["A) populate()", "B) fill()", "C) associate()", "D) link()"],
//     correctAnswer: "A) populate()",
//   },
//   {
//     question:
//       "What is the primary purpose of the Express framework in a Node.js application?",
//     options: [
//       "A) To manage session cookies",
//       "B) To serve static files",
//       "C) To create a robust API and handle HTTP requests",
//       "D) To interact with databases directly",
//     ],
//     correctAnswer: "C) To create a robust API and handle HTTP requests",
//   },
//   {
//     question:
//       "Which of the following is a valid way to declare a variable in JavaScript?",
//     options: [
//       "A) int number = 5;",
//       "B) var number = 5;",
//       "C) number = 5;",
//       "D) let number := 5;",
//     ],
//     correctAnswer: "B) var number = 5;",
//   },
// ];

// // Main function to insert exam
// export const createAIExam = async () => {
//   try {
//     const newExam = new Exam({
//       companyId: "6650d1b6b0f123456789abcd", // Replace with actual ObjectId
//       jobId: "6650d1b6b0f123456789abce", // Replace with actual ObjectId
//       examTitle: "Node.js & Mongoose Fundamentals",
//       topic: "JavaScript Backend",
//       noOfQuestion: jsonData.length,
//       timeLimit: 30, // in minutes
//       questions: jsonData,
//     });

//     const savedExam = await newExam.save();
//     console.log("Exam saved:", savedExam);
//   } catch (error) {
//     console.error("Error creating exam:", error.message);
//   }
// };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateMCQs(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let content = response.choices[0].message.content?.trim();

    if (!content) {
      throw new Error("Empty response from OpenAI.");
    }

    // 🔍 Try to extract JSON array from the response
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
}

// 📦 Controller to create and save an auto-generated MCQ exam
export const createAIExam = async (req, res) => {
  try {
    const companyId = "682348dec6c50c7e91275a2f";
    const jobId = "682348dec6c50c7e91275a2f";
    const { examTitle, topic, noOfQuestion, hard, medium, easy, timeLimit } =
      req.body;

    // ✅ Validate inputs
    const missingFields = [];
    for (const field of [
      "examTitle",
      "topic",
      "noOfQuestion",
      "hard",
      "medium",
      "easy",
      "timeLimit",
    ]) {
      if (!req.body[field] && req.body[field] !== 0) {
        missingFields.push(field);
      }
    }

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
        statusCode: 400,
      });
    }

    const totalDifficulty = hard + medium + easy;
    if (totalDifficulty !== 100) {
      return res.status(400).json({
        success: false,
        message: "Difficulty percentages must sum to 100.",
        statusCode: 400,
      });
    }

    // 🧠 Create a structured prompt
    const prompt = `
Generate exactly ${noOfQuestion} multiple-choice questions on the topic "${topic}".

Instructions:
- Each question must be clear, technical, and accurate.
- Each must have 4 answer options, labeled like: "A) ...", "B) ...", "C) ...", "D) ...".
- The correctAnswer must match the full option string, e.g., "B) var number = 5;".
- Distribute difficulty as: ${hard}% hard, ${medium}% medium, ${easy}% easy.
- Return ONLY a valid JSON array, no explanation or extra text.

Format:
[
  {
    "question": "Question here?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A) ..."
  }
]

Return only this JSON array, nothing else.
`.trim();

    // 🔁 Generate MCQs
    const questions = await generateMCQs(prompt);

    console.log(questions);

    // 📝 Save exam to DB
    const newExam = new Exam({
      companyId,
      jobId,
      examTitle,
      topic,
      noOfQuestion,
      timeLimit,
      questions,
    });

    await newExam.save();

    res.status(201).json({
      success: true,
      message: "AI-generated exam created successfully",
      data: newExam,
      statusCode: 201,
    });
  } catch (error) {
    console.error("❌ Error creating exam:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      statusCode: 500,
    });
  }
};
