import express from "express";
import bcrypt from "bcrypt";
import UserModel from "./models/user-model.js";

const router = express.Router();
const saltRounds = 10;

const checkIsPhoneNumber = (credential) => {
  return (
    credential.length === 8 &&
    !isNaN(Number(credential)) &&
    ["9", "8", "7", "6"].includes(credential[0])
  );
};

const checkIsEmail = (credential) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(credential);
};

const validatePassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  return passwordRegex.test(password);
};

router.post("/signup", async (req, res) => {
  const { credential, password, fullName, userName } = req.body;

  if (!credential || credential === "") {
    return res.status(400).send({ message: "Email or Phone required!" });
  }
  if (!password || password === "") {
    return res.status(400).send({ message: "Password required!" });
  }
  if (!validatePassword(password)) {
    return res.status(400).send({
      message:
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }
  if (!fullName || fullName === "") {
    return res.status(400).send({ message: "Fullname required!" });
  }
  if (!userName || userName === "") {
    return res.status(400).send({ message: "Username required!" });
  }

  const isPhoneNumber = checkIsPhoneNumber(credential);
  const isEmail = checkIsEmail(credential);

  if (!isPhoneNumber && !isEmail) {
    return res
      .status(400)
      .send({ message: "Invalid phone number or email format!" });
  }

  try {
    const existingUser = await UserModel.findOne({
      $or: [{ email: credential }, { phone: credential }],
    });

    if (existingUser) {
      return res
        .status(400)
        .send({ message: "Email or Phone already registered!" });
    }

    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        return res.status(500).send({ message: "Error hashing password" });
      }

      const newUser = {
        email: isEmail ? credential : "",
        phone: isPhoneNumber ? credential : "",
        password: hash,
        fullName,
        userName,
      };

      try {
        await UserModel.create(newUser);
        return res
          .status(201)
          .send({ message: "User registered successfully" });
      } catch (error) {
        return res
          .status(500)
          .send({ message: "Error creating user", error: error.message });
      }
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Server error", error: error.message });
  }
});

router.post("/signin", async (req, res) => {
  const { credential, password } = req.body;

  try {
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
  const { email, password, newPassword } = req.body;

  if (!validatePassword(newPassword)) {
    return res.status(400).send({
      message:
        "New password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  try {
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
  const { email, password, newEmail } = req.body;

  try {
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
