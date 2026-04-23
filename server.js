const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());

// IMPORTANT: do NOT use express.json() for binary uploads
// we handle raw buffers manually

// ================= FOLDERS =================
const imageFolder = path.join(__dirname, "uploads/images");
const fileFolder  = path.join(__dirname, "uploads/files");

fs.mkdirSync(imageFolder, { recursive: true });
fs.mkdirSync(fileFolder, { recursive: true });

// ================= STATIC FILE ACCESS =================
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
// 📁 FILE UPLOAD (RAW BINARY)
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
// 📄 FILE LIST (ESP32 SAFE FORMAT)
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
// 📄 DIRECT FILE ACCESS (VERY IMPORTANT)
// ======================================================
app.get("/files/:name", (req, res) => {

  const filePath = path.join(fileFolder, req.params.name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Not found");
  }

  res.sendFile(filePath);
});

// ======================================================
// 🖼 IMAGE LIST (OPTIONAL TEST)
// ======================================================
app.get("/gallery", (req, res) => {

  const files = fs.readdirSync(imageFolder);

  let html = "<h1>Images</h1>";

  files.forEach(f => {
    html += `<img src="/images/${f}" width="200"/><br/>`;
  });

  res.send(html);
});

// ======================================================
// 🚀 START SERVER
// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
