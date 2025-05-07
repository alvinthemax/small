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
      
      // Read the file as binary and convert to base64
      const fileContent = fs.readFileSync(file.filepath);
      const content = fileContent.toString('base64');

      // GitHub API requires the SHA if updating an existing file
      let sha;
      try {
        const existingFile = await octokit.repos.getContent({
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          path: filePath,
          branch: process.env.GITHUB_BRANCH,
        });
        sha = existingFile.data.sha;
      } catch (e) {
        // File doesn't exist, sha will remain undefined
        if (e.status !== 404) throw e;
      }

      const result = await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
        message: `Upload ${fileName}`,
        content,
        sha, // Include SHA if updating existing file
        branch: process.env.GITHUB_BRANCH,
      });

      const url = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH}/${filePath}`;

      // Clean up the temporary file
      fs.unlinkSync(file.filepath);

      res.status(200).json({
        message: "File uploaded successfully",
        fileName,
        path: filePath,
        url,
        commit: result.data.commit.html_url,
      });
    } catch (e) {
      console.error("Upload failed:", e);
      // Clean up temp file even if upload fails
      if (files.file?.filepath) {
        try { fs.unlinkSync(files.file.filepath); } catch (cleanupErr) {}
      }
      res.status(500).json({ 
        error: e.message || "Unknown error",
        details: e.response?.data || null 
      });
    }
  });
}
