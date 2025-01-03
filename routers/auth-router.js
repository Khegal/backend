import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import UserModel from "../models/user-model.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";

dotenv.config();

const router = express.Router();

const checkIsPhoneNumber = (credential) => {
  return /^[6-9]\d{7}$/.test(credential);
};

const checkIsEmail = (credential) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(credential);
};

router.post("/signup", async (req, res) => {
  const { credential, password, fullname, username } = req.body;

  if (!credential || !password || !fullname || !username) {
    return res.status(400).send({ message: "All fields are required!" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .send({ message: "Password must be at least 8 characters long!" });
  }

  try {
    const existingUser = await UserModel.findOne({
      $or: [{ username }, { email: credential }, { phone: credential }],
    });

    if (existingUser) {
      return res.status(400).send({ message: "User already exists!" });
    }

    const isPhoneNumber = checkIsPhoneNumber(credential);
    const isEmail = checkIsEmail(credential);

    if (!isPhoneNumber && !isEmail) {
      return res
        .status(400)
        .send({ message: "Invalid email or phone number!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      [isPhoneNumber ? "phone" : "email"]: credential,
      fullname,
      username,
      password: hashedPassword,
    };

    const createdUser = await UserModel.create(newUser);

    return res.status(201).send({
      message: "User created successfully!",
      user: {
        id: createdUser._id,
        username: createdUser.username,
        fullname: createdUser.fullname,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Signup failed!", error: error.message });
  }
});

router.post("/signin", async (req, res) => {
  const { credential, password } = req.body;

  if (!credential || !password) {
    return res
      .status(400)
      .send({ message: "Credential and password are required!" });
  }

  try {
    const existingUser = await UserModel.findOne({
      $or: [
        { phone: credential },
        { email: credential },
        { username: credential },
      ],
    });

    if (!existingUser) {
      return res.status(400).send({ message: "Invalid credentials!" });
    }

    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatch) {
      return res.status(400).send({ message: "Invalid credentials!" });
    }
    const accessToken = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "10h",
      }
    );

    return res.status(200).send({ message: "Signin successful!", accessToken });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Signin failed!", error: error.message });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  return res.status(200).send({ user: req.user });
});

router.post("/me", authMiddleware, async (req, res) => {
  try {
    const { fullname } = req.body;
    if (!fullname) {
      return res.status(400).send({ message: "Fullname is required!" });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      { fullname },
      { new: true }
    );

    return res.status(200).send({
      message: "User updated successfully!",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        fullname: updatedUser.fullname,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Update failed!", error: error.message });
  }
});

export default router;
