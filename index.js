import express from "express";
import authRouter from "./authRouter.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PORT = process.env.PORT || 3333;
const app = express();

app.use(express.json());
app.use("/users", authRouter);

app.listen(PORT, async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1); // Exit process with failure
  }
});
