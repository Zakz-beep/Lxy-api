import express from "express";
import multer from "multer";
import { isAuthenticated } from "../middlewares/auth.js";
import { User } from "../db/schema.js";
import path from "path";
import fs from "fs";

const routerUpload = express.Router();

// Pastikan folder uploads/ ada
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
  fileFilter: (req, file, cb) => {
    const valid = ["image/jpeg", "image/png", "image/jpg"];
    if (!valid.includes(file.mimetype)) {
      return cb(new Error("Only jpg, jpeg, png allowed"), false);
    }
    cb(null, true);
  },
});

// POST /api/upload/avatar
routerUpload.post("/avatar", isAuthenticated, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Hapus file lama jika ada
    if (req.user.avatarUrl) {
      const oldFile = path.basename(req.user.avatarUrl);
      const oldPath = path.join(uploadDir, oldFile);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    await req.user.update({ avatarUrl: fileUrl });

    res.json({ message: "Avatar uploaded", avatarUrl: fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});

export default routerUpload;
