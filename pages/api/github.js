import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'my-image-gallery/v1.0'
});

// Cache configuration
const CACHE_TTL = 60 * 1000; // 1 minute cache
let cache = {
  timestamp: 0,
  data: null
};

export default async function handler(req, res) {
  // Set response headers
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Validate environment variables
    if (!process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      throw new Error('GitHub repository configuration is missing');
    }

    // Check cache first
    const now = Date.now();
    if (cache.data && now - cache.timestamp < CACHE_TTL) {
      return res.status(200).json(cache.data);
    }

    // Fetch from GitHub
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "data/images",
      ref: process.env.GITHUB_BRANCH || 'main',
    });

    // Validate response
    if (!Array.isArray(data)) {
      throw new Error('Expected an array of files but got a different response');
    }

    // Filter and map images
    const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = data
      .filter(file => 
        file.type === 'file' && 
        validImageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      )
      .map(file => {
        let lastModified;
        try {
          lastModified = file.download_url.includes('?') 
            ? new Date(file.download_url.split('?')[1].split('=')[1]).toISOString()
            : new Date().toISOString();
        } catch {
          lastModified = new Date().toISOString();
        }

        return {
          name: file.name,
          url: file.download_url,
          size: file.size,
          lastModified
        };
      });

    // Update cache
    cache = {
      timestamp: now,
      data: images
    };

    res.status(200).json(images);
  } catch (error) {
    console.error('GitHub API Error:', error);
    
    // Handle specific GitHub API errors
    if (error.status === 404) {
      return res.status(200).json([]);
    }
    
    if (error.status === 403) {
      return res.status(429).json({ 
        error: 'API rate limit exceeded',
        details: 'Please try again later'
      });
    }

    res.status(error.status || 500).json({ 
      error: error.message || 'Failed to fetch images',
      details: error.response?.data || null
    });
  }
}
