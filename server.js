const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ================= FOLDERS =================
const imageFolder = path.join(__dirname, "uploads/images");
const textFolder  = path.join(__dirname, "uploads/texts");
const fileFolder  = path.join(__dirname, "uploads/files");

fs.mkdirSync(imageFolder, { recursive: true });
fs.mkdirSync(textFolder, { recursive: true });
fs.mkdirSync(fileFolder, { recursive: true });

// ================= STATIC =================
app.use("/images", express.static(imageFolder));
app.use("/files", express.static(fileFolder));

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("ESP32 Cloud Server Running 🚀");
});

// ======================================================
// 📸 IMAGE UPLOAD
// ======================================================
app.post("/upload-image", (req, res) => {

  const filename = Date.now() + ".jpg";
  const filePath = path.join(imageFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", (chunk) => buffer = Buffer.concat([buffer, chunk]));

  req.on("end", () => {

    if (!buffer || buffer.length < 1000) {
      return res.status(400).send("Invalid image");
    }

    fs.writeFile(filePath, buffer, (err) => {
      if (err) return res.status(500).send("Save failed");

      res.json({
        status: "uploaded",
        file: filename,
        url: `/images/${filename}`
      });
    });
  });
});

// ======================================================
// 📁 FILE UPLOAD (.bin or raw)
// ======================================================
app.post("/upload-file", (req, res) => {

  const filename = Date.now() + ".bin";
  const filePath = path.join(fileFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", (chunk) => buffer = Buffer.concat([buffer, chunk]));

  req.on("end", () => {

    if (!buffer || buffer.length === 0) {
      return res.status(400).send("Empty file");
    }

    fs.writeFile(filePath, buffer, (err) => {
      if (err) return res.status(500).send("Save failed");

      res.json({
        status: "uploaded",
        file: filename,
        link: `/files/${filename}`
      });
    });
  });
});

// ======================================================
// 📡 ESP32 FILE LIST (IMPORTANT)
// ======================================================
app.get("/api/files", (req, res) => {

  try {
    const files = fs.readdirSync(fileFolder);

    const list = files.map(f => ({
      name: f,
      url: `/files/${f}`
    }));

    res.json(list);

  } catch (err) {
    res.json([]);
  }
});

// ======================================================
// 📄 FIXED: GET SINGLE FILE (VERY IMPORTANT)
// ======================================================
app.get("/api/file", (req, res) => {

  const name = req.query.name;

  if (!name) {
    return res.status(400).send("Missing file name");
  }

  const filePath = path.join(fileFolder, name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  // THIS is what ESP32 expects (raw text)
  const content = fs.readFileSync(filePath, "utf8");

  res.send(content);
});

// ======================================================
// 📝 TEXT FILES
// ======================================================
app.post("/upload-text", (req, res) => {

  const { filename, content } = req.body;

  if (!filename || !content) {
    return res.status(400).send("Missing data");
  }

  const filePath = path.join(textFolder, filename);

  fs.writeFile(filePath, content, (err) => {
    if (err) return res.status(500).send("Failed");

    res.json({ status: "saved" });
  });
});

app.get("/texts", (req, res) => {
  try {
    res.json(fs.readdirSync(textFolder));
  } catch {
    res.json([]);
  }
});

// ======================================================
// 🚀 START
// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
  console.log("📸 Image folder:", imageFolder);
  console.log("📁 File folder:", fileFolder);
});
