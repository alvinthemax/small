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
    if (err) return res.status(500).json({ error: "File parse error" });

    const file = files.file;
    const content = fs.readFileSync(file.filepath, { encoding: "base64" });

    const path = `data/images/${file.originalFilename}`;

    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
        message: `Upload ${file.originalFilename}`,
        content,
        branch: process.env.GITHUB_BRANCH,
      });

      res.status(200).json({ message: "File uploaded successfully" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}
