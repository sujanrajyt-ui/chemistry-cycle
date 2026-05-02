import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: "Method not allowed"});

  const { name, subject, score, total } = req.body;
  if (!name || !subject || score === undefined || total === undefined) {
    return res.status(400).json({error: "Missing fields"});
  }

  const owner = process.env.GITHUB_OWNER || 'sujanrajyt-ui';
  const repo = process.env.GITHUB_REPO || 'chemistry-cycle';
  const token = process.env.GITHUB_TOKEN;

  if (!token) return res.status(500).json({error: "Server configuration error"});

  // Derive a 32-byte key from the token
  const key = crypto.createHash('sha256').update(token).digest();

  async function fetchFile() {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/scores.enc`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (response.status === 404) return { content: null, sha: null };
    if (!response.ok) throw new Error("Failed to fetch existing scores");
    const data = await response.json();
    return { content: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha };
  }

  function decrypt(text) {
    if (!text) return [];
    try {
      const textParts = text.split(':');
      const iv = Buffer.from(textParts.shift(), 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return JSON.parse(decrypted.toString());
    } catch (e) {
      console.error("Decryption failed", e);
      return [];
    }
  }

  function encrypt(data) {
    const text = JSON.stringify(data);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  let attempts = 0;
  while (attempts < 3) {
    try {
      attempts++;
      const { content, sha } = await fetchFile();
      const scores = decrypt(content);
      
      scores.push({
        name, subject, score, total,
        date: new Date().toISOString()
      });

      const encryptedContent = encrypt(scores);
      const base64Content = Buffer.from(encryptedContent).toString('base64');

      const payload = {
        message: `Add score for ${name} in ${subject}`,
        content: base64Content,
        branch: 'main'
      };
      if (sha) payload.sha = sha;

      const putResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/scores.enc`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (putResponse.status === 409) {
        // Conflict, try again
        continue;
      }
      if (!putResponse.ok) {
        throw new Error("Failed to save score");
      }

      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(500).json({ error: "Failed to save due to high concurrency" });
}
