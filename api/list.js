import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true
});

export default async function handler(req, res) {
  const { subject } = req.query;
  if (!subject) return res.status(400).json({error: "Subject missing"});

  try {
    // Using the resources API by prefix is 100x more robust and instant than the search index!
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `chemistry_cycle/${subject}`,
      max_results: 50
    });
      
    const files = result.resources.map(f => ({
      name: f.public_id.split('/').pop(),
      url: f.secure_url,
      public_id: f.public_id
    }));

    res.status(200).json(files);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
