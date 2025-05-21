import express from "express";
import { createAIExam } from "../controller/examController.js";
const router = express.Router();

router.post("/createAiExam", createAIExam);

export default router;
