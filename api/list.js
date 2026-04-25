import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  const { subject } = req.query;

  if (!subject) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  try {
    // We search for resources in the specific folder based on the subject.
    // E.g., folder: chemistry_cycle/IPP
    const result = await cloudinary.search
      .expression(`folder:chemistry_cycle/${subject}`)
      .sort_by('created_at','desc')
      .max_results(50)
      .execute();

    const files = result.resources.map(file => ({
      name: file.filename,
      url: file.secure_url
    }));

    res.status(200).json(files);
  } catch (error) {
    console.error('Cloudinary Error:', error);
    res.status(500).json({ error: 'Failed to load files' });
  }
}
