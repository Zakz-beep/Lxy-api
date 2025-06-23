// middlewares/uploadMiddleware.js
import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

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
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const valid = ["image/jpeg", "image/png", "image/jpg"];
    if (!valid.includes(file.mimetype)) {
      return cb(new Error("Only jpg, jpeg, png allowed"), false);
    }
    cb(null, true);
  },
});

export { upload, uploadDir };
