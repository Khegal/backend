import express from "express";
import PostModel from "../models/post-model.js";

const router = express.Router();

router.post("/createPost", async (res, req) => {
  const { descreption } = req.body;
  await PostModel.create({ descreption: descreption });
});

export default router;
