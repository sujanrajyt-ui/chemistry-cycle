import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET,
  secure: true
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: "Method not allowed"});
  
  const { public_id, resource_type = 'image' } = req.body;
  
  if (!public_id) {
    return res.status(400).json({error: "public_id is required"});
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id, { resource_type });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
