const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());

// ================= FOLDERS =================
const imageFolder = path.join(__dirname, "uploads/images");
const textFolder = path.join(__dirname, "uploads/texts");

// ensure folders exist
fs.mkdirSync(imageFolder, { recursive: true });
fs.mkdirSync(textFolder, { recursive: true });

// ================= SERVE IMAGES =================
app.use("/images", express.static(imageFolder));

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("ESP32 Cloud System Running 🚀");
});

// ======================================================
// 🔥 FIXED IMAGE UPLOAD (RAW JPEG FROM ESP32)
// ======================================================
app.post("/upload-image", (req, res) => {
  try {
    const filename = Date.now() + ".jpg";
    const filePath = path.join(imageFolder, filename);

    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream);

    req.on("end", () => {
      console.log("Image saved:", filename);

      res.json({
        status: "uploaded",
        file: filename
      });
    });

    req.on("error", (err) => {
      console.error("Upload error:", err);
      res.status(500).send("Upload failed");
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Server error");
  }
});

// ================= IMAGE GALLERY =================
app.get("/gallery", (req, res) => {

  let files = [];

  try {
    files = fs.readdirSync(imageFolder);
  } catch (err) {
    return res.send("No images yet");
  }

  let html = `
    <h1>ESP32 Image Gallery</h1>
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

// ================= TEXT UPLOAD =================
app.post("/upload-text", express.json(), (req, res) => {
  const { filename, content } = req.body;

  if (!filename || !content) {
    return res.status(400).send("Missing filename or content");
  }

  try {
    const filePath = path.join(textFolder, filename);
    fs.writeFileSync(filePath, content);

    res.json({ status: "text saved" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to save text");
  }
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
  console.log("🚀 Server running on port", PORT);
  console.log("📸 Image folder:", imageFolder);
});
