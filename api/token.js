export default function handler(req, res) {
  // Simple protection so bots on the internet can't steal the token
  if (req.query.pass !== 'sujanraj') {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    return res.status(500).json({ error: "No GitHub token found in Vercel." });
  }

  res.status(200).json({ token });
}
