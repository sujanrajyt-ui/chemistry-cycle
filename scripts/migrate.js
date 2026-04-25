import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

// 1. Enter your Cloudinary Auth Keys Here
cloudinary.config({
  cloud_name: 'YOUR_CLOUD_NAME_HERE',
  api_key: 'YOUR_API_KEY_HERE',
  api_secret: 'YOUR_API_SECRET_HERE',
  secure: true,
});

// 2. These are the existing old Supabase keys that hold your pdfs
const supabase = createClient(
  'https://brvbbxbfcrcpgkxxfuhv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydmJieGJmY3JjcGdreHhmdWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NzM1MzIsImV4cCI6MjA4MDE0OTUzMn0.Z8FYzhVSn0eMgQAWcXg9ul70AeSyWMid4dFtrhAZalQ'
);

const subjects = ['IPP', 'EEE', 'MAT', 'CHY', 'EV', 'ESS', 'BIO', 'ADLD'];

async function migrate() {
  console.log("Starting Migration...");

  for (const subject of subjects) {
    console.log(`\nChecking Supabase folder: chemistry_cycle/${subject}`);
    
    // Fetch list of files in subject
    const { data: files, error } = await supabase.storage
      .from('notes')
      .list(`chemistry_cycle/${subject}`);

    if (error) {
      console.error("Error reading from Supabase:", error);
      continue;
    }

    if (!files || files.length === 0) {
      console.log(`No files found in ${subject}.`);
      continue;
    }

    for (const file of files) {
      if (file.name === '.emptyFolderPlaceholder') continue; // skip folders

      const filePath = `chemistry_cycle/${subject}/${file.name}`;
      console.log(`Downloading: ${file.name}`);

      // Download file buffer from Supabase
      const { data: blob, error: downloadError } = await supabase.storage
        .from('notes')
        .download(filePath);

      if (downloadError) {
        console.error("Failed to download", file.name, downloadError);
        continue;
      }

      console.log(`Uploading to Cloudinary...`);
      const buffer = Buffer.from(await blob.arrayBuffer());

      // Safe filename without extension
      const safeTitle = file.name.split('.').slice(0, -1).join('.').replace(/[^a-zA-Z0-9 _-]/g, '').replace(/ /g, '_');
      const tagContent = `chemistry_cycle_${subject}`;

      // Upload to Cloudinary using Streams
      await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `chemistry_cycle/${subject}`,
            public_id: safeTitle,
            resource_type: 'auto',
            tags: [tagContent] // Tag is necessary for the frontend list feature
          },
          (err, result) => {
            if (err) {
              console.error("Cloudinary failed", file.name, err);
              reject(err);
            } else {
              console.log(`Successfully migrated ${file.name}!`);
              resolve(result);
            }
          }
        );

        uploadStream.end(buffer);
      });
    }
  }

  console.log("\nMigration Complete! All PDFs are now in Cloudinary.");
}

migrate();
