import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET,
  secure: true
});

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: "Method not allowed"});
  
  const { folder, public_id } = req.body;
  const timestamp = Math.round((new Date).getTime() / 1000);
  
  // Create signature for Cloudinary upload
  const signature = cloudinary.utils.api_sign_request({
    timestamp,
    folder,
    public_id
  }, process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET);
  
  res.status(200).json({ 
    timestamp, 
    signature, 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY 
  });
}
