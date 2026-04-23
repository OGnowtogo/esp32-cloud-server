const express = require("express");
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
// 📸 IMAGE UPLOAD (ROBUST)
// ======================================================
app.post("/upload-image", (req, res) => {

  const filename = Date.now() + ".jpg";
  const filePath = path.join(imageFolder, filename);

  const chunks = [];

  req.on("data", chunk => chunks.push(chunk));

  req.on("end", () => {

    const buffer = Buffer.concat(chunks);

    if (buffer.length < 500) {
      return res.status(400).send("Invalid image");
    }

    try {
      fs.writeFileSync(filePath, buffer);

      console.log("📸 Saved:", filename);

      res.json({
        ok: true,
        file: filename,
        url: `/images/${filename}`
      });

    } catch (err) {
      res.status(500).send("Save failed");
    }
  });

  req.on("error", () => {
    res.status(500).send("Upload error");
  });
});

// ======================================================
// 📁 FILE UPLOAD
// ======================================================
app.post("/upload-file", (req, res) => {

  const filename = Date.now() + ".txt";
  const filePath = path.join(fileFolder, filename);

  const chunks = [];

  req.on("data", chunk => chunks.push(chunk));

  req.on("end", () => {

    const buffer = Buffer.concat(chunks);

    if (!buffer.length) {
      return res.status(400).send("Empty file");
    }

    try {
      fs.writeFileSync(filePath, buffer);

      console.log("📁 Saved:", filename);

      res.json({
        ok: true,
        file: filename,
        url: `/files/${filename}`
      });

    } catch (err) {
      res.status(500).send("Save failed");
    }
  });
});

// ======================================================
// 📄 FILE LIST (SAFE)
// ======================================================
app.get("/api/files", (req, res) => {

  try {
    const files = fs.readdirSync(fileFolder);

    res.json(files.map(name => ({
      name,
      url: `/files/${name}`
    })));

  } catch (e) {
    res.json([]);
  }
});

// ======================================================
// 📄 GET FILE (ESP32 SAFE STREAM)
// ======================================================
app.get("/api/file", (req, res) => {

  const name = req.query.name;

  if (!name) return res.status(400).send("Missing name");

  const filePath = path.join(fileFolder, name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Not found");
  }

  res.setHeader("Content-Type", "text/plain");
  fs.createReadStream(filePath).pipe(res);
});

// ======================================================
// 🖼️ GALLERY (SAFE HTML)
// ======================================================
app.get("/gallery", (req, res) => {

  try {
    const files = fs.readdirSync(imageFolder).reverse();

    let html = "<h1>ESP32 Gallery</h1>";

    if (!files.length) {
      html += "<p>No images yet</p>";
    }

    files.forEach(f => {
      html += `
        <div style="margin:10px">
          <img src="/images/${f}" width="250"/>
          <p>${f}</p>
        </div>
      `;
    });

    res.send(html);

  } catch (e) {
    res.send("Gallery error");
  }
});

// ======================================================
// 📁 FILE PAGE
// ======================================================
app.get("/files-page", (req, res) => {

  try {
    const files = fs.readdirSync(fileFolder).reverse();

    let html = "<h1>Files</h1>";

    if (!files.length) {
      html += "<p>No files yet</p>";
    }

    files.forEach(f => {
      html += `<a href="/files/${f}" target="_blank">${f}</a><br/>`;
    });

    res.send(html);

  } catch (e) {
    res.send("Files error");
  }
});

// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
