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
const fileFolder  = path.join(__dirname, "uploads/files");

// create folders safely
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
// 📸 IMAGE UPLOAD (UNCHANGED - ESP32 RAW)
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
// 📁 FILE UPLOAD (USER + ESP32 SAFE)
// ======================================================
app.post("/upload-file", (req, res) => {

  const filename = Date.now() + ".bin";
  const filePath = path.join(fileFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
  });

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
// 🖼️ IMAGE GALLERY (WORKING)
// ======================================================
app.get("/gallery", (req, res) => {

  let files = fs.readdirSync(imageFolder);

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
// 📁 FILE MANAGER PAGE (FOR USER)
// ======================================================
app.get("/files-page", (req, res) => {

  let files = fs.readdirSync(fileFolder);

  let html = `
    <h1>📁 File Manager</h1>
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
// 🧑‍💻 SIMPLE UPLOAD UI (FOR USERS)
// ======================================================
app.get("/upload", (req, res) => {

  res.send(`
    <h1>📤 Upload File</h1>

    <input type="file" id="fileInput" />
    <button onclick="uploadFile()">Upload</button>

    <p id="status"></p>

    <script>
      async function uploadFile() {
        const file = document.getElementById("fileInput").files[0];

        if (!file) {
          document.getElementById("status").innerText = "Select a file first";
          return;
        }

        const buffer = await file.arrayBuffer();

        const res = await fetch("/upload-file", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream"
          },
          body: buffer
        });

        const data = await res.json();

        document.getElementById("status").innerText =
          res.ok ? "Uploaded: " + data.file : "Upload failed";
      }
    </script>
  `);
});

// ======================================================
// 📝 TEXT UPLOAD
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
// 📡 NEW: API FOR ESP32 FILE LIST
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
// 🚀 START SERVER
// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
  console.log("📸 Image folder:", imageFolder);
  console.log("📁 File folder:", fileFolder);
});
