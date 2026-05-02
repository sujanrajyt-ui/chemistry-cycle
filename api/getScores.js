import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({error: "Method not allowed"});

  // Same password check as token.js
  if (req.query.pass !== 'sujanraj') {
    return res.status(401).json({error: "Unauthorized"});
  }

  const owner = process.env.GITHUB_OWNER || 'sujanrajyt-ui';
  const repo = process.env.GITHUB_REPO || 'chemistry-cycle';
  const token = process.env.GITHUB_TOKEN;

  if (!token) return res.status(500).json({error: "Server configuration error"});

  const key = crypto.createHash('sha256').update(token).digest();

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/scores.enc`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (response.status === 404) return res.status(200).json([]); // No scores yet
    if (!response.ok) throw new Error("Failed to fetch existing scores");
    
    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf8');

    // Decrypt
    const textParts = content.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    const scores = JSON.parse(decrypted.toString());
    
    return res.status(200).json(scores);
  } catch (e) {
    console.error("Fetch/Decryption failed", e);
    return res.status(500).json({ error: e.message });
  }
}
