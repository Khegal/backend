import express from "express";
import PostModel from "../models/post-model.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import CommentModel from "../models/comment-model.js";
import LikeModel from "../models/like-model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const posts = await PostModel.find({})
    .populate("user", "profileUrl username")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "profileUrl username",
      },
    })
    .sort({ createdAt: -1 });
  return res.send(posts);
});

router.post("/", authMiddleware, async (req, res) => {
  const user = req.user;
  const { description, mediaUrl } = req.body;
  const newPost = await PostModel.create({
    description,
    mediaUrl,
    user: user._id,
  });
  return res.send(newPost);
});

router.get("/user/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const posts = await PostModel.find({ user: _id });
    return res.send(posts);
  } catch {
    return res
      .status(500)
      .json({ message: "Server can't handle that request" });
  }
});

router.post("/:postId/comments", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    const user = req.user;
    const newComment = await CommentModel.create({
      comment,
      post: postId,
      user: user._id,
    });
    return res.send(newComment);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server can't handle that request" });
  }
});

router.post("/:postId/like", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const user = req.user;

    const existingLike = await LikeModel.findOne({
      post: postId,
      user: user._id,
    });

    if (existingLike) {
      await LikeModel.findByIdAndDelete(existingLike._id);

      await PostModel.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });

      return res.status(200).json({ message: "Post unliked" });
    } else {
      const newLike = await LikeModel.create({
        post: postId,
        user: user._id,
      });

      await PostModel.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });

      return res.status(200).send(newLike);
    }
  } catch (err) {
    console.error("Error toggling like:", err);
    return res
      .status(500)
      .json({ message: "Server can't handle that request" });
  }
});

export default router;
