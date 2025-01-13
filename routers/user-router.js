import express from "express";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import FollowModel from "../models/follow-model.js";
import UserModel from "../models/user-model.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id)
      .populate({
        path: "following",
        populate: {
          path: "follow",
          select: "username profileUrl",
        },
      })
      .populate({
        path: "followers",
        populate: {
          path: "user",
          select: "username profileUrl",
        },
      });

    return res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user data:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await UserModel.findOne({ username })
      .populate({
        path: "following",
        model: FollowModel,
        populate: {
          path: "follow",
          select: "username profileUrl",
        },
      })
      .populate({
        path: "followers",
        model: FollowModel,
        populate: {
          path: "user",
          select: "username profileUrl",
        },
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/:userId/follow", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === userId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingFollow = await FollowModel.findOne({
      user: currentUserId,
      follow: userId,
    });

    if (existingFollow) {
      await FollowModel.findByIdAndDelete(existingFollow._id);

      await UserModel.findByIdAndUpdate(userId, {
        $pull: { followers: currentUserId },
        $inc: { followersCount: -1 },
      });

      await UserModel.findByIdAndUpdate(currentUserId, {
        $pull: { following: userId },
        $inc: { followingCount: -1 },
      });

      return res.status(200).json({ message: "User unfollowed" });
    } else {
      const newFollow = await FollowModel.create({
        user: currentUserId,
        follow: userId,
      });

      await UserModel.findByIdAndUpdate(userId, {
        $push: { followers: currentUserId },
        $inc: { followersCount: 1 },
      });

      await UserModel.findByIdAndUpdate(currentUserId, {
        $push: { following: userId },
        $inc: { followingCount: 1 },
      });

      return res
        .status(200)
        .json({ message: "User followed", follow: newFollow });
    }
  } catch (err) {
    console.error("Error toggling follow:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
