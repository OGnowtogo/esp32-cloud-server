const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ================= FOLDERS =================
const imageFolder = path.join(__dirname, "uploads/images");
const textFolder = path.join(__dirname, "uploads/texts");
const fileFolder = path.join(__dirname, "uploads/files");

// create folders (SAFE - no overwrite)
fs.mkdirSync(imageFolder, { recursive: true });
fs.mkdirSync(textFolder, { recursive: true });
fs.mkdirSync(fileFolder, { recursive: true });

// ================= STATIC SERVING =================
app.use("/images", express.static(imageFolder));
app.use("/files", express.static(fileFolder));

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("ESP32 Cloud Server Running 🚀");
});

// ======================================================
// 📸 IMAGE UPLOAD (UNCHANGED - WORKING)
// ======================================================
app.post("/upload-image", (req, res) => {

  const filename = Date.now() + ".jpg";
  const filePath = path.join(imageFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
  });

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
// 📁 FILE UPLOAD (NEW FEATURE)
// ======================================================
app.post("/upload-file", (req, res) => {

  const filename = Date.now() + ".txt";
  const filePath = path.join(fileFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
  });

  req.on("end", () => {

    if (buffer.length === 0) {
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
// 🖼️ IMAGE GALLERY (UNCHANGED)
// ======================================================
app.get("/gallery", (req, res) => {

  let files = [];

  try {
    files = fs.readdirSync(imageFolder);
  } catch (err) {
    return res.send("No images yet");
  }

  let html = `
    <h1>📸 ESP32 Image Gallery</h1>
    <p>Total images: ${files.length}</p>
    <hr/>
  `;

  files.reverse().forEach(file => {
    html += `
      <div style="margin:10px;display:inline-block;text-align:center">
        <img src="/images/${file}" width="300" style="border-radius:10px"/>
        <p>${file}</p>
      </div>
    `;
  });

  res.send(html);
});

// ======================================================
// 📁 FILE LIST PAGE (FIXED - NO CONFLICT)
// ======================================================
app.get("/files-page", (req, res) => {

  let files = [];

  try {
    files = fs.readdirSync(fileFolder);
  } catch (err) {
    return res.send("No files yet");
  }

  let html = `
    <h1>📁 ESP32 File Manager</h1>
    <p>Total files: ${files.length}</p>
    <hr/>
  `;

  files.reverse().forEach(file => {
    html += `
      <div style="margin:10px">
        📄 <a href="/files/${file}" target="_blank">${file}</a>
      </div>
    `;
  });

  res.send(html);
});

// ======================================================
// 📝 TEXT UPLOAD (UNCHANGED)
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

// ======================================================
// 📄 TEXT LIST
// ======================================================
app.get("/texts", (req, res) => {

  try {
    const files = fs.readdirSync(textFolder);
    res.json(files);
  } catch (err) {
    res.json([]);
  }
});

// ======================================================
// 🚀 START SERVER
// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
  console.log("📸 Image folder:", imageFolder);
  console.log("📁 File folder:", fileFolder);
});
