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
    const result = await cloudinary.search
      .expression(`folder:chemistry_cycle/${subject}`)
      .sort_by('created_at','desc')
      .max_results(50)
      .execute();
      
    const files = result.resources.map(f => ({
      name: f.filename,
      url: f.secure_url,
      public_id: f.public_id
    }));

    res.status(200).json(files);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
