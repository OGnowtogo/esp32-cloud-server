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
// 📸 IMAGE UPLOAD (RAW ESP32 JPEG)
// ======================================================
app.post("/upload-image", (req, res) => {

  const filename = Date.now() + ".jpg";
  const filePath = path.join(imageFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", chunk => {
    buffer = Buffer.concat([buffer, chunk]);
  });

  req.on("end", () => {

    if (!buffer || buffer.length < 500) {
      return res.status(400).send("Invalid image");
    }

    fs.writeFile(filePath, buffer, err => {
      if (err) return res.status(500).send("Save failed");

      console.log("📸 Image saved:", filename);

      res.json({
        status: "ok",
        file: filename,
        url: `/images/${filename}`
      });
    });
  });
});

// ======================================================
// 📁 FILE UPLOAD (TEXT OR BINARY FROM USER OR ESP32)
// ======================================================
app.post("/upload-file", (req, res) => {

  const filename = Date.now() + ".txt"; // better for ESP32 reading
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

      console.log("📁 File saved:", filename);

      res.json({
        status: "ok",
        file: filename,
        url: `/files/${filename}`
      });
    });
  });
});

// ======================================================
// 📄 ESP32 FILE LIST (IMPORTANT FORMAT FIXED)
// ======================================================
app.get("/api/files", (req, res) => {

  try {
    const files = fs.readdirSync(fileFolder);

    const list = files.map(name => ({
      name,
      url: `/files/${name}`
    }));

    res.json(list);

  } catch (err) {
    res.json([]);
  }
});

// ======================================================
// 📄 GET SINGLE FILE (ESP32 OPEN FILE)
// ======================================================
app.get("/api/file", (req, res) => {

  const name = req.query.name;

  if (!name) return res.status(400).send("Missing name");

  const filePath = path.join(fileFolder, name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Not found");
  }

  res.send(fs.readFileSync(filePath, "utf8"));
});

// ======================================================
// 🖼️ IMAGE GALLERY (WORKING WEB VIEW)
// ======================================================
app.get("/gallery", (req, res) => {

  const files = fs.readdirSync(imageFolder).reverse();

  let html = `
    <h1>📸 ESP32 Gallery</h1>
    <p>Total images: ${files.length}</p>
    <hr/>
  `;

  files.forEach(file => {
    html += `
      <div style="margin:10px">
        <img src="/images/${file}" width="250"/>
        <p>${file}</p>
      </div>
    `;
  });

  res.send(html);
});

// ======================================================
// 📁 FILE VIEW PAGE (WEB BROWSER)
// ======================================================
app.get("/files-page", (req, res) => {

  const files = fs.readdirSync(fileFolder).reverse();

  let html = `
    <h1>📁 Files</h1>
    <p>Total: ${files.length}</p>
    <hr/>
  `;

  files.forEach(file => {
    html += `
      <div>
        📄 <a href="/files/${file}" target="_blank">${file}</a>
      </div>
    `;
  });

  res.send(html);
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
