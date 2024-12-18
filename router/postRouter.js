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
router.get("/retrievePosts", async (req, res) => {
  try {
    const posts = await PostModel.find();
    res.status(200).send(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to retrieve posts" });
  }
});

export default router;
