const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());

// ================= FOLDERS =================
const imageFolder = path.join(__dirname, "uploads/images");
const textFolder = path.join(__dirname, "uploads/texts");

// create folders
fs.mkdirSync(imageFolder, { recursive: true });
fs.mkdirSync(textFolder, { recursive: true });

// ================= STATIC IMAGES =================
app.use("/images", express.static(imageFolder));

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("ESP32 Cloud Server Running 🚀");
});

// ======================================================
// 📸 IMAGE UPLOAD (ROBUST RAW BINARY HANDLER)
// ======================================================
app.post("/upload-image", (req, res) => {
  const filename = Date.now() + ".jpg";
  const filePath = path.join(imageFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
  });

  req.on("end", () => {

    console.log("📦 Received bytes:", buffer.length);

    if (!buffer || buffer.length < 1000) {
      console.log("❌ Invalid image received");
      return res.status(400).send("Invalid image");
    }

    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.log("❌ Save error:", err);
        return res.status(500).send("Save failed");
      }

      console.log("💾 Saved image:", filename);

      res.json({
        status: "uploaded",
        file: filename,
        size: buffer.length,
        url: `/images/${filename}`
      });
    });
  });

  req.on("error", (err) => {
    console.log("❌ Request error:", err);
    res.status(500).send("Upload failed");
  });
});

// ======================================================
// 🖼️ GALLERY VIEW
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
// 📝 TEXT UPLOAD
// ======================================================
app.use(express.json());

app.post("/upload-text", (req, res) => {
  const { filename, content } = req.body;

  if (!filename || !content) {
    return res.status(400).send("Missing data");
  }

  const filePath = path.join(textFolder, filename);

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      return res.status(500).send("Failed to save text");
    }

    res.json({ status: "saved" });
  });
});

// ======================================================
// 📄 LIST TEXT FILES
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
});
