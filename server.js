const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());

// ================= FOLDERS =================
const imageFolder = path.join(__dirname, "uploads/images");
const fileFolder = path.join(__dirname, "uploads/files");

// create folders
fs.mkdirSync(imageFolder, { recursive: true });
fs.mkdirSync(fileFolder, { recursive: true });

// static access (IMPORTANT FOR ESP32 URLs)
app.use("/images", express.static(imageFolder));
app.use("/files", express.static(fileFolder));

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("ESP32 Server Running 🚀");
});

// ================= IMAGE UPLOAD =================
app.post("/upload-image", (req, res) => {

  const filename = Date.now() + ".jpg";
  const filePath = path.join(imageFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", chunk => buffer = Buffer.concat([buffer, chunk]));

  req.on("end", () => {
    fs.writeFileSync(filePath, buffer);

    res.json({
      status: "ok",
      file: filename,
      url: `/images/${filename}`
    });
  });
});

// ================= FILE UPLOAD =================
app.post("/upload-file", (req, res) => {

  const filename = Date.now() + ".bin";
  const filePath = path.join(fileFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", chunk => buffer = Buffer.concat([buffer, chunk]));

  req.on("end", () => {
    fs.writeFileSync(filePath, buffer);

    res.json({
      status: "ok",
      file: filename,
      url: `/files/${filename}`
    });
  });
});

// ================= FILE LIST (ESP32 USES THIS) =================
app.get("/api/files", (req, res) => {

  const files = fs.readdirSync(fileFolder);

  const list = files.map(f => ({
    name: f,
    url: `/files/${f}`
  }));

  res.json(list);
});

// ================= START =================
const PORT = 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
  console.log("Image:", imageFolder);
  console.log("Files:", fileFolder);
});
