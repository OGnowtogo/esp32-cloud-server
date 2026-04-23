const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

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
// 📤 WEB UPLOAD PAGE (FIXED MISSING ROUTE)
// ======================================================
app.get("/upload", (req, res) => {

  res.send(`
    <h1>📤 Upload File</h1>

    <input type="file" id="file"/>
    <button onclick="upload()">Upload</button>

    <p id="status"></p>

    <script>
      async function upload() {
        const file = document.getElementById("file").files[0];
        if (!file) return alert("Select file");

        const buffer = await file.arrayBuffer();

        const res = await fetch("/upload-file", {
          method: "POST",
          headers: {"Content-Type": "application/octet-stream"},
          body: buffer
        });

        const text = await res.text();
        document.getElementById("status").innerText = text;
      }
    </script>
  `);
});


// ======================================================
// 📸 IMAGE UPLOAD
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
// 📁 FILE UPLOAD
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
// 📸 GALLERY PAGE (FIXED MISSING ROUTE)
// ======================================================
app.get("/gallery", (req, res) => {

  const files = fs.readdirSync(imageFolder);

  let html = "<h1>📸 Gallery</h1>";

  files.reverse().forEach(f => {
    html += `
      <div style="margin:10px">
        <img src="/images/${f}" width="200"/>
        <p>${f}</p>
      </div>
    `;
  });

  res.send(html);
});


// ======================================================
// 📁 FILE PAGE (BROWSER VIEW)
// ======================================================
app.get("/files-page", (req, res) => {

  const files = fs.readdirSync(fileFolder);

  let html = "<h1>📁 Files</h1>";

  files.reverse().forEach(f => {
    html += `<p><a href="/files/${f}" target="_blank">${f}</a></p>`;
  });

  res.send(html);
});


// ======================================================
// 📄 FILE LIST API (ESP32)
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
// 📄 GET FILE CONTENT (ESP32)
// ======================================================
app.get("/api/file", (req, res) => {

  const name = req.query.name;

  if (!name) return res.status(400).send("Missing file");

  const filePath = path.join(fileFolder, name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Not found");
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
