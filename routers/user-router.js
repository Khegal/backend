import express from "express";
import UserModel from "../models/user-model.js";
import FollowModel from "../models/follow-model.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { nanoid } from "nanoid";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

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

cloudinary.config({
  cloud_name: process.env.CLOUDNARY_NAME,
  api_key: process.env.CLOUDNARY_API_KEY,
  api_secret: process.env.CLOUDNARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${nanoid()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.use(upload.single("file"));

router.get("/:username", async (req, res) => {
  const { username } = req.params;
  const user = await UserModel.findOne({ username })
    .populate("posts")
    .populate("followers")
    .populate("followings");
  return res.send(user);
});

router.post("/:username/image", authMiddleware, async (req, res) => {
  const username = req.params.username;
  const currentUsername = req.user.username;

  if (username !== currentUsername)
    return res
      .status(403)
      .send({ message: "You cant't change other user profile" });

  try {
    const response = await cloudinary.uploader.upload(req.file.path);
    const profileUrl = response.secure_url;
    await UserModel.updateOne({ username }, { profileUrl });
    return res.send({ message: "Updated success!", profileUrl });
  } catch (err) {
    return res.status(500).send({
      message: "Failed to upload!",
    });
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
