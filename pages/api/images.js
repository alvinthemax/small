import { Octokit } from "@octokit/rest";
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false
  }
};

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'nextjs-github-upload/v1.0'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024 // 5MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = file.originalFilename || path.basename(file.filepath);
    const filePath = `data/images/${fileName}`;
    const fileContent = await fs.readFile(file.filepath);
    const content = fileContent.toString('base64');

    // Check if file exists to get SHA
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: filePath,
        branch: process.env.GITHUB_BRANCH || 'main'
      });
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    // Upload to GitHub
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filePath,
      message: `Upload ${fileName}`,
      content,
      sha,
      branch: process.env.GITHUB_BRANCH || 'main'
    });

    const url = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH || 'main'}/${filePath}`;

    // Clean up temporary file
    await fs.unlink(file.filepath);

    return res.status(200).json({
      message: 'File uploaded successfully',
      fileName,
      path: filePath,
      url,
      commit: data.commit.html_url
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Upload failed',
      details: error.response?.data || null
    });
  }
}
