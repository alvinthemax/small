import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { data } = req.body;
  const path = "data/airdrop/data.json";

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
    });

    const sha = fileData.sha;
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      message: "Update airdrop data",
      content,
      branch: process.env.GITHUB_BRANCH,
      sha,
    });

    res.status(200).json({ message: "JSON updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
