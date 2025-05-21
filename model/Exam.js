import mongoose from "mongoose";

const mcqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    validate: [(arr) => arr.length === 4, "Exactly 4 options are required"],
  },
  correctAnswer: {
    type: String,
    required: true,
    validate: {
      validator: function (val) {
        return this.options.includes(val);
      },
      message: "Correct answer must be one of the options.",
    },
  },
});

const examSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  examTitle: { type: String, required: true },
  topic: { type: String, required: true },
  noOfQuestion: { type: Number, required: true },
  timeLimit: { type: Number, required: true }, // in minutes
  questions: { type: [mcqSchema], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Exam", examSchema);
