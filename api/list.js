export default async function handler(req, res) {
  const { subject } = req.query;
  if (!subject) return res.status(400).json({ error: "Subject missing" });

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return res.status(500).json({ error: "GitHub environment variables missing in Vercel!" });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/notes/${subject}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (response.status === 404) {
      return res.status(200).json([]); // Folder doesn't exist yet, meaning zero files
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map GitHub API response to our app format
    const files = data.filter(f => f.type === 'file').map(f => ({
      name: f.name,
      url: `https://raw.githubusercontent.com/${owner}/${repo}/main/notes/${subject}/${f.name}`,
      path: f.path, // Used for delete/rename operations
      sha: f.sha    // Used for delete/rename operations
    }));

    res.status(200).json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
