import express from "express";
import authRouter from "./router/authRouter.js";
import postRouter from "./router/postRouter.js";
import fileRouter from "./router/fileRouter.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ path: ".env" });

const PORT = process.env.PORT || 3333;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/users", authRouter);
app.use("/posts", postRouter);
app.use("/fileUpload", fileRouter);

app.listen(PORT, async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
});
