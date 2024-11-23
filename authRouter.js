import express from "express";
import * as fs from "fs";
import { nanoid } from "nanoid";
import { object, string } from "yup";
import bcrypt from "bcrypt";
const saltRounds = 10;

const router = express.Router();

let users = [];

let signUpSchema = object({
  userName: string().required("Must not be empty"),
  password: string().required("Must not be empty").min(8),
  email: string().email("Must be a valid email").required("Must not be empty"),
});

let loginSchema = object({
  email: string().email("Must be a valid email").required("Must not be empty"),
  password: string().required("Must not be empty").min(8),
});

let changePassword = object({
  email: string().email("Must be a valid email").required("Must not be empty"),
  password: string().required("Must not be empty").min(8),
  newPassword: string(),
});

let changeEmail = object({
  email: string().email("Must be a valid email").required("Must not be empty"),
  password: string().required("Must not be empty").min(8),
  newEmail: string(),
});

if (fs.existsSync("users.json")) {
  const data = fs.readFileSync("users.json", "utf-8");
  if (data.length > 0) {
    users = JSON.parse(data);
  }
}

router.get("", (req, res) => {
  if (users.length === 0) {
    return res.status(404).json({ error: "No users found" });
  }
  res.json(users);
});

router.post("/signup", async (req, res) => {
  try {
    const { userName, email, password } = await signUpSchema.validate(req.body);

    users = JSON.parse(fs.readFileSync("users.json", "utf-8"));

    const emailCheck = users.find((user) => user.email === email);
    if (emailCheck) {
      return res.status(400).send({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
      id: nanoid(),
      userName,
      email,
      password: hashedPassword,
    };

    users.push(newUser);
    fs.writeFileSync("users.json", JSON.stringify(users));

    res.status(201).json({ message: "New user created" });
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = await loginSchema.validate(req.body);

    const user = users.find((user) => user.email === email);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).send({ message: "Incorrect password" });
    }

    return res.status(200).send({ message: "Successful login" });
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
});

router.put("/changePassword", async (req, res) => {
  try {
    const { email, password, newPassword } = await changePassword.validate(
      req.body
    );
    const user = users.find((user) => user.email === email);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send({ message: "Incorrect password" });
    }

    // Update password and save to file
    user.password = await bcrypt.hash(newPassword, saltRounds);
    fs.writeFileSync("users.json", JSON.stringify(users));

    return res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "An error occurred", error: error.message });
  }
});

router.put("/changeEmail", async (req, res) => {
  try {
    const { email, password, newEmail } = await changeEmail.validate(req.body);
    const user = users.find((user) => user.email === email);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const newEmailTaken = users.some(
      (userWithSame) => userWithSame.email === newEmail
    );

    if (newEmailTaken) {
      return res.status(400).send({ message: "Email already in use" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send({ message: "Incorrect password" });
    }

    if (user.email === newEmail) {
      return res
        .status(400)
        .send({ message: "New email is the same as the current email" });
    }

    user.email = newEmail;
    fs.writeFileSync("users.json", JSON.stringify(users));

    return res.status(200).send({ message: "Email updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "An error occurred", error: error.message });
  }
});

export default router;
