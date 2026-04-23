Skip to content
OGnowtogo
esp32-cloud-server
Repository navigation
Code
Issues
Pull requests
Actions
Projects
Wiki
Security and quality
Insights
Settings
esp32-cloud-server
/
server.js
in
main

Edit

Preview
Indent mode

Spaces
Indent size

2
Line wrap mode

No wrap
Editing server.js file contents
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
201
202
203
204
205
206
207
208
209
210
211
212
213
214
215
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

Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
