const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Memory storage (holds file in RAM temporary buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 3. POST /api/messages/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Convert file buffer to Data URI
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload directly to Cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: 'chat_media',
      resource_type: 'auto', // Handles images, audio, video, documents
    });

    // Return the URL expected by PrivateChat.jsx
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ error: 'Media upload failed' });
  }
});

module.exports = router;