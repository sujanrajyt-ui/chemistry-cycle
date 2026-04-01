import { google } from "googleapis";
import multer from "multer";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({ dest: "/tmp" });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, upload.single("file"));

  const { title, subject } = req.body;

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  const response = await drive.files.create({
    requestBody: {
      name: `${title}.pdf`,
    },
    media: {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    },
  });

  const fileId = response.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  const url = `https://drive.google.com/uc?id=${fileId}`;

  // TEMP store (you'll upgrade later)
  global.filesDB = global.filesDB || [];
  global.filesDB.push({ title, subject, url });

  res.json({ url });
}
