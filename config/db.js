import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()

const connectDb = async (req, res) => {
  await mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      console.log("mongoose connected");
    })
    .catch((err) => {
      console.log(err);
    });
};

export default connectDb;
