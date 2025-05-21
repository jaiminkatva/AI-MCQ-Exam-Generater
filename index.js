import express from "express";
import connectDb from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();
connectDb();

import examRoute from "./router/exam.js";

const app = express();

app.use(express.json())

app.get("/", (req, res) => {
  res.send("hello ............");
});

app.use("/", examRoute);

const port = process.env.PORT || 3000;
app.listen(port, console.log("server started on port 3000"));
