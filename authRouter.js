import express from "express";
import bcrypt from "bcrypt";
import UserModel from "./models/user-model.js";

const router = express.Router();
const saltRounds = 10;

router.post("/signup", async (req, res) => {
  const { credential, password, fullName, userName } = req.body;

  if (!credential || credential === "") {
    return res.status(400).send({ message: "Email or Phone required!" });
  }
  if (!password || password === "") {
    return res.status(400).send({ message: "Password required!" });
  }
  if (!fullName || fullName === "") {
    return res.status(400).send({ message: "Fullname required!" });
  }
  if (!userName || userName === "") {
    return res.status(400).send({ message: "Username required!" });
  }

  const existingUser = await UserModel.findOne({
    $or: [{ email: credential }, { phone: credential }],
  });

  if (existingUser)
    return res
      .status(400)
      .send({ message: "Email or Phone already registered!" });

  bcrypt.hash(password, saltRounds, async function (err, hash) {
    const newUser = {
      email: credential.includes("@") ? credential : "",
      phone: credential.includes("@") ? "" : credential,
      password: hash,
      fullName,
      userName,
    };

    await UserModel.create(newUser);
    return res.status(201).send({ message: "User registered successfully" });
  });
});

router.post("/signin", async (req, res) => {
  try {
    const { credential, password } = req.body;
    const user = await UserModel.findOne({
      $or: [{ email: credential }, { phone: credential }],
    });

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
