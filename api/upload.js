// Important: Vercel Free limits body size to ~4.5MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: "Method not allowed"});
  
  const { subject, filename, base64Content } = req.body;
  if (!subject || !filename || !base64Content) {
    return res.status(400).json({error: "Missing fields"});
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  try {
    const payload = {
      message: `CMS Upload: ${filename} to ${subject}`,
      content: base64Content,
      branch: 'main'
    };

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/notes/${subject}/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || response.statusText);
    }

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
