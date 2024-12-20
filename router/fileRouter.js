import express from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${nanoid()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const router = express.Router();

const upload = multer({ storage });

router.use(upload.single("file"));

router.post("/", async (req, res) => {
  try {
    const response = await cloudinary.uploader.upload(req.file.path);
    return res.send({
      message: "Uploaded!",
      fileUrl: response.secure_url,
    });
  } catch (err) {
    return res.status(500).send({
      message: "Failed to upload!",
    });
  }
});

export default router;
