import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "data/images",
    });

    const images = data.map((file) => ({
      name: file.name,
      url: file.download_url,
    }));

    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
