const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());

// ================= FOLDERS =================
const imageFolder = path.join(__dirname, "uploads/images");
const fileFolder = path.join(__dirname, "uploads/files");

fs.mkdirSync(imageFolder, { recursive: true });
fs.mkdirSync(fileFolder, { recursive: true });

// ================= STATIC =================
app.use("/images", express.static(imageFolder));
app.use("/files", express.static(fileFolder));

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("ESP32 Server Running 🚀");
});

// ======================================================
// 📸 IMAGE UPLOAD (RAW JPEG)
// ======================================================
app.post("/upload-image", (req, res) => {

  const filename = Date.now() + ".jpg";
  const filePath = path.join(imageFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", chunk => {
    buffer = Buffer.concat([buffer, chunk]);
  });

  req.on("end", () => {

    if (!buffer || buffer.length < 1000) {
      return res.status(400).send("Invalid image");
    }

    fs.writeFile(filePath, buffer, err => {
      if (err) return res.status(500).send("Save failed");

      res.json({
        file: filename,
        url: `/images/${filename}`
      });
    });
  });
});

// ======================================================
// 📁 FILE UPLOAD (BINARY)
// ======================================================
app.post("/upload-file", (req, res) => {

  const filename = Date.now() + ".bin";
  const filePath = path.join(fileFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", chunk => {
    buffer = Buffer.concat([buffer, chunk]);
  });

  req.on("end", () => {

    if (!buffer || buffer.length === 0) {
      return res.status(400).send("Empty file");
    }

    fs.writeFile(filePath, buffer, err => {
      if (err) return res.status(500).send("Save failed");

      res.json({
        file: filename,
        url: `/files/${filename}`
      });
    });
  });
});

// ======================================================
// 📄 FILE LIST (IMPORTANT FOR ESP32)
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
// 📄 GET SINGLE FILE (IMPORTANT FIX)
// used by ESP32 /api/file?name=xxx
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

  res.sendFile(filePath);
});

// ======================================================
// 🚀 START SERVER
// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
  console.log("📸 Images:", imageFolder);
  console.log("📁 Files:", fileFolder);
});
