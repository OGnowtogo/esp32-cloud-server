const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ================= FOLDERS =================
const imageFolder = "uploads/images";
const textFolder = "uploads/texts";

// ensure folders exist
fs.mkdirSync(imageFolder, { recursive: true });
fs.mkdirSync(textFolder, { recursive: true });

// ================= SERVE IMAGES =================
app.use("/images", express.static(imageFolder));

// ================= STORAGE =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageFolder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("ESP32 Cloud System Running 🚀");
});

// ================= IMAGE UPLOAD =================
app.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No image uploaded");
  }

  res.json({
    status: "uploaded",
    file: req.file.filename
  });
});

// ================= IMAGE GALLERY =================
app.get("/gallery", (req, res) => {

  let files = [];
  try {
    files = fs.readdirSync(imageFolder);
  } catch (err) {
    return res.send("No images yet");
  }

  let html = "<h1>ESP32 Image Gallery</h1>";

  files.forEach(file => {
    html += `
      <div style="margin:10px">
        <img src="/images/${file}" width="300"/>
        <p>${file}</p>
      </div>
    `;
  });

  res.send(html);
});

// ================= TEXT UPLOAD =================
app.post("/upload-text", (req, res) => {
  const { filename, content } = req.body;

  if (!filename || !content) {
    return res.status(400).send("Missing filename or content");
  }

  try {
    fs.writeFileSync(
      path.join(textFolder, filename),
      content
    );
  } catch (err) {
    return res.status(500).send("Failed to save text");
  }

  res.json({ status: "text saved" });
});

// ================= GET TEXT FILES =================
app.get("/texts", (req, res) => {

  let files = [];
  try {
    files = fs.readdirSync(textFolder);
  } catch (err) {
    return res.json([]);
  }

  res.json(files);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
