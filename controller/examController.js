import Exam from "../model/Exam.js";
import generateMCQs from "../utils/generateMCQs.js";

export const createAIExam = async (req, res) => {
  try {
    const companyId = "682348dec6c50c7e91275a2f";
    const jobId = "682348dec6c50c7e91275a2f";
    const { examTitle, topic, noOfQuestion, hard, medium, easy, timeLimit } =
      req.body;

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

    // Helper to generate a specific difficulty batch with retry logic
    const generateBatchWithRetry = async (count, difficultyLabel) => {
      let attempts = 0;
      let collected = [];

      while (collected.length < count && attempts < 3) {
        const prompt = `
Generate exactly ${
          count - collected.length
        } ${difficultyLabel} multiple-choice questions on the topic "${topic}".

Instructions:
- Each question must be clear, technical, and accurate.
- Each must have 4 answer options, labeled like: "A) ...", "B) ...", "C) ...", "D) ...".
- The correctAnswer must match the full option string, e.g., "B) var number = 5;".
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

        try {
          const batch = await generateMCQs(prompt);
          collected.push(...batch);
        } catch (err) {
          console.warn(
            `⚠️ Attempt ${attempts + 1} failed for ${difficultyLabel}:`,
            err.message
          );
        }

        attempts++;
      }

      if (collected.length !== count) {
        throw new Error(
          `Expected ${count} ${difficultyLabel} questions, but got ${collected.length}`
        );
      }

      return collected;
    };

    // Calculate question distribution
    const hardCount = Math.round((hard / 100) * noOfQuestion);
    const mediumCount = Math.round((medium / 100) * noOfQuestion);
    const easyCount = noOfQuestion - hardCount - mediumCount;

    // Generate questions by difficulty
    const hardQuestions = await generateBatchWithRetry(hardCount, "hard");
    const mediumQuestions = await generateBatchWithRetry(mediumCount, "medium");
    const easyQuestions = await generateBatchWithRetry(easyCount, "easy");

    const questions = [...hardQuestions, ...mediumQuestions, ...easyQuestions];

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

export const getAllExam = async (req, res) => {
  const exams = await Exam.find();

  if (!exams) {
    res.status(404).json({
      success: false,
      message: "Exam not available!!",
      status: 404,
    });
  }

  res.status(200).json({
    success: true,
    data: [
      {
        totalExams: exams.length,
        data: exams,
      },
    ],
    status: 404,
  });
};
