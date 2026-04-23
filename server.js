clean it for me this wiil work?? const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());

// ================= FOLDERS =================
const imageFolder = path.join(__dirname, "uploads/images");
const fileFolder  = path.join(__dirname, "uploads/files");

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
// 📸 IMAGE UPLOAD (STABLE)
// ======================================================
app.post("/upload-image", (req, res) => {

  const filename = Date.now() + ".jpg";
  const filePath = path.join(imageFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", chunk => buffer = Buffer.concat([buffer, chunk]));

  req.on("end", () => {

    if (buffer.length < 500) {
      return res.status(400).send("Invalid image");
    }

    fs.writeFile(filePath, buffer, err => {
      if (err) return res.status(500).send("Save failed");

      console.log("📸 Saved:", filename);

      res.json({
        ok: true,
        file: filename,
        url: `/images/${filename}`
      });
    });
  });
});

// ======================================================
// 📁 FILE UPLOAD (SAFE)
// ======================================================
app.post("/upload-file", (req, res) => {

  const filename = Date.now() + ".txt";
  const filePath = path.join(fileFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", chunk => buffer = Buffer.concat([buffer, chunk]));

  req.on("end", () => {

    if (buffer.length === 0) {
      return res.status(400).send("Empty file");
    }

    fs.writeFile(filePath, buffer, err => {
      if (err) return res.status(500).send("Save failed");

      console.log("📁 Saved:", filename);

      res.json({
        ok: true,
        file: filename,
        url: `/files/${filename}`
      });
    });
  });
});

// ======================================================
// 📄 FILE LIST (ESP32 SAFE)
// ======================================================
app.get("/api/files", (req, res) => {

  try {
    const files = fs.readdirSync(fileFolder);

    res.json(
      files.map(name => ({
        name,
        url: `/files/${name}`
      }))
    );

  } catch (e) {
    res.json([]);
  }
});

// ======================================================
// 📄 GET FILE (ESP32 SAFE FIX)
// ======================================================
app.get("/api/file", (req, res) => {

  const name = req.query.name;

  if (!name) return res.status(400).send("Missing name");

  const filePath = path.join(fileFolder, name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Not found");
  }

  // IMPORTANT FIX: safe read for ESP32
  res.setHeader("Content-Type", "text/plain");

  fs.createReadStream(filePath).pipe(res);
});

// ======================================================
// 🖼️ GALLERY
// ======================================================
app.get("/gallery", (req, res) => {

  const files = fs.readdirSync(imageFolder).reverse();

  let html = "<h1>ESP32 Gallery</h1>";

  files.forEach(f => {
    html += `<img src="/images/${f}" width="250"/><p>${f}</p>`;
  });

  res.send(html);
});

// ======================================================
// 📁 FILE PAGE
// ======================================================
app.get("/files-page", (req, res) => {

  const files = fs.readdirSync(fileFolder).reverse();

  let html = "<h1>Files</h1>";

  files.forEach(f => {
    html += `<a href="/files/${f}" target="_blank">${f}</a><br/>`;
  });

  res.send(html);
});

// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
