import { Octokit } from "@octokit/rest";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(500).json({ error: "File parse error" });
    }

    try {
      const file = files.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileName = file.originalFilename;
      const filePath = `data/images/${fileName}`;
      const content = fs.readFileSync(file.filepath, { encoding: "base64" });

      const result = await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
        message: `Upload ${fileName}`,
        content,
        branch: process.env.GITHUB_BRANCH,
      });

      const url = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH}/${filePath}`;

      res.status(200).json({
        message: "File uploaded successfully",
        fileName,
        path: filePath,
        url,
      });
    } catch (e) {
      console.error("Upload failed:", e);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  });
}
