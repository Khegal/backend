import express from "express";
import PostModel from "../models/post-model.js";

const router = express.Router();

router.post("/createPost", async (req, res) => {
  const { descreption } = req.body;

  try {
    await PostModel.create({ descreption });
    res.status(201).send({ message: "Post creaeted succesfully" });
  } catch (error) {
    console.log(error);
  }
});

router.get("/", async (req, res) => {
  const posts = await PostModel.find({}).sort({ createdAt: -1 });
  return res.send(posts);
});

export default router;
