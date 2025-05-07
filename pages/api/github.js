import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'nextjs-github-upload/v1.0'
});

export default async function handler(req, res) {
  try {
    if (!process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      throw new Error('GitHub repository configuration is missing');
    }

    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'data/images',
      branch: process.env.GITHUB_BRANCH || 'main'
    });

    if (!Array.isArray(data)) {
      return res.status(200).json([]);
    }

    const images = data
      .filter(file => file.type === 'file')
      .map(file => ({
        name: file.name,
        url: file.download_url,
        size: file.size
      }));

    return res.status(200).json(images);

  } catch (error) {
    console.error('GitHub API Error:', error);
    
    if (error.status === 404) {
      return res.status(200).json([]);
    }
    
    return res.status(error.status || 500).json({ 
      error: error.message || 'Failed to fetch images'
    });
  }
}
