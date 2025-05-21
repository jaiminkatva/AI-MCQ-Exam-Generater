import express from "express";
import { createAIExam, getAllExam } from "../controller/examController.js";
const router = express.Router();

router.post("/createAiExam", createAIExam);
router.get("/exams", getAllExam);

export default router;
