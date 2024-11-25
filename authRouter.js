import express from "express";
import bcrypt from "bcrypt";
import UserModel from "./models/user-model.js";

const router = express.Router();
const saltRounds = 10;

router.post("/signup", async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).send({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = await UserModel.create({
      email,
      password: hashedPassword,
      userName,
    });
    return res
      .status(201)
      .send({ message: "User created successfully", user: newUser });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "An error occurred", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send({ message: "Incorrect password" });
    }
    return res.status(200).send({ message: "Successful login" });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "An error occurred", error: error.message });
  }
});

router.put("/changePassword", async (req, res) => {
  try {
    const { email, password, newPassword } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send({ message: "Incorrect password" });
    }
    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();
    return res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "An error occurred", error: error.message });
  }
});

router.put("/changeEmail", async (req, res) => {
  try {
    const { email, password, newEmail } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send({ message: "Incorrect password" });
    }
    const newEmailTaken = await UserModel.findOne({ email: newEmail });
    if (newEmailTaken) {
      return res.status(400).send({ message: "Email already in use" });
    }
    user.email = newEmail;
    await user.save();
    return res.status(200).send({ message: "Email updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "An error occurred", error: error.message });
  }
});

export default router;
