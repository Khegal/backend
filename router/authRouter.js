import express from "express";
import bcrypt from "bcrypt";
import UserModel from "../models/user-model.js";

const router = express.Router();
const SALT_ROUNDS = 10;

// Utility functions
const isPhoneNumber = (credential) => /^[6-9]\d{7}$/.test(credential);

const isEmail = (credential) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credential);

const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(
    password
  );

const handleServerError = (res, error) =>
  res.status(500).send({ message: "Server error", error: error.message });

// Routes
router.post("/signup", async (req, res) => {
  const { credential, password, fullName, userName } = req.body;

  if (!credential)
    return res.status(400).send({ message: "Email or Phone required!" });
  if (!password) return res.status(400).send({ message: "Password required!" });
  if (!validatePassword(password))
    return res.status(400).send({
      message:
        "Password must include uppercase, lowercase, number, and special character.",
    });
  if (!fullName) return res.status(400).send({ message: "Fullname required!" });
  if (!userName) return res.status(400).send({ message: "Username required!" });

  const isPhone = isPhoneNumber(credential);
  const isValidEmail = isEmail(credential);

  if (!isPhone && !isValidEmail)
    return res
      .status(400)
      .send({ message: "Invalid phone number or email format!" });

  try {
    const existingUser = await UserModel.findOne({
      $or: [{ email: credential }, { phone: credential }],
    });

    if (existingUser)
      return res
        .status(400)
        .send({ message: "Email or Phone already registered!" });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await UserModel.create({
      email: isValidEmail ? credential : "",
      phone: isPhone ? credential : "",
      password: hashedPassword,
      fullName,
      userName,
    });

    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    handleServerError(res, error);
  }
});

router.post("/signin", async (req, res) => {
  const { credential, password } = req.body;

  try {
    const user = await UserModel.findOne({
      $or: [{ email: credential }, { phone: credential }],
    });

    if (!user) return res.status(404).send({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).send({ message: "Incorrect password" });

    res.status(200).send({ message: "Successful login" });
  } catch (error) {
    handleServerError(res, error);
  }
});

router.put("/changePassword", async (req, res) => {
  const { email, password, newPassword } = req.body;

  if (!validatePassword(newPassword))
    return res.status(400).send({
      message:
        "New password must include uppercase, lowercase, number, and special character.",
    });

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).send({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).send({ message: "Incorrect password" });

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    handleServerError(res, error);
  }
});

router.put("/changeEmail", async (req, res) => {
  const { email, password, newEmail } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).send({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).send({ message: "Incorrect password" });

    const isTaken = await UserModel.findOne({ email: newEmail });
    if (isTaken)
      return res.status(400).send({ message: "Email already in use" });

    user.email = newEmail;
    await user.save();

    res.status(200).send({ message: "Email updated successfully" });
  } catch (error) {
    handleServerError(res, error);
  }
});

export default router;
