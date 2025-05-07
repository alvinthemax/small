// pages/api/images.js
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
  if (req.method !== "POST") {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const form = new formidable.IncomingForm();
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileName = file.originalFilename;
    const filePath = `data/images/${fileName}`;
    const fileContent = fs.readFileSync(file.filepath);
    const content = fileContent.toString('base64');

    // Check if file exists to get SHA
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
      if (e.status !== 404) throw e;
    }

    const result = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      message: `Upload ${fileName}`,
      content,
      sha,
      branch: process.env.GITHUB_BRANCH,
    });

    const url = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH}/${filePath}`;

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      message: "File uploaded successfully",
      fileName,
      path: filePath,
      url,
      commit: result.data.commit.html_url,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ 
      error: error.message || "Upload failed",
      details: error.response?.data || null
    });
  }
}
