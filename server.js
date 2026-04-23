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

app.use("/images", express.static(imageFolder));
app.use("/files", express.static(fileFolder));

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("ESP32 Server Running");
});

// ================= IMAGE UPLOAD =================
app.post("/upload-image", (req, res) => {

  const filename = Date.now() + ".jpg";
  const filePath = path.join(imageFolder, filename);

  let buffer = Buffer.alloc(0);

  req.on("data", chunk => buffer = Buffer.concat([buffer, chunk]));

  req.on("end", () => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) return res.status(500).send("error");

      res.json({
        file: filename,
        url: "/images/" + filename
      });
    });
  });
});

// ================= FILE LIST (ESP32) =================
app.get("/api/files", (req, res) => {

  const files = fs.readdirSync(fileFolder);

  res.json(
    files.map(f => ({
      name: f,
      url: "/files/" + f
    }))
  );
});

// ================= FILE CONTENT (IMPORTANT FIX) =================
app.get("/api/file", (req, res) => {

  const name = req.query.name;
  if (!name) return res.status(400).send("missing");

  const filePath = path.join(fileFolder, name);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(404).send("not found");
    res.send(data);
  });
});

// ================= START =================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
