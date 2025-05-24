const express = require('express');
const router = express.Router();
const multer = require('multer');
const Music = require('../models/Music');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configure multer for audio file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create new music
router.post('/', auth, upload.single('audio'), async (req, res) => {
  try {
    const { title, description, roomId, isPublic } = req.body;
    const newMusic = new Music({
      title,
      description,
      audioUrl: req.file.path,
      creator: req.user.id,
      roomId,
      isPublic
    });

    await newMusic.save();
    res.json(newMusic);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user's music library
router.get('/library', auth, async (req, res) => {
  try {
    const music = await Music.find({ creator: req.user.id });
    res.json(music);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get public music
router.get('/public', async (req, res) => {
  try {
    const music = await Music.find({ isPublic: true })
      .populate('creator', 'username')
      .sort({ createdAt: -1 });
    res.json(music);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update music
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, isPublic } = req.body;
    let music = await Music.findById(req.params.id);

    if (!music) {
      return res.status(404).json({ message: 'Music not found' });
    }

    if (music.creator.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    music = await Music.findByIdAndUpdate(
      req.params.id,
      { title, description, isPublic },
      { new: true }
    );

    res.json(music);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete music
router.delete('/:id', auth, async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);

    if (!music) {
      return res.status(404).json({ message: 'Music not found' });
    }

    if (music.creator.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await music.remove();
    res.json({ message: 'Music removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/generate', upload.single('audio'), async (req, res) => {
  try {
    const { description } = req.body;
    const audioFile = req.file;
    if (!audioFile || !description) {
      return res.status(400).json({ message: 'Audio file and description are required.' });
    }

    const formData = new FormData();
    formData.append('prompt', description);
    formData.append('audio', fs.createReadStream(audioFile.path), audioFile.originalname);
    formData.append('duration', 45);
    formData.append('seed', 0);
    formData.append('steps', 50);
    formData.append('cfg_scale', 7.0);
    formData.append('output_format', 'mp3');
    formData.append('strength', 1.0);

    const response = await axios.post(
      'https://api.stability.ai/v2beta/audio/stable-audio-2/audio-to-audio',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: 'audio/*',
        },
        responseType: 'arraybuffer',
      }
    );

    // 保存生成的音频
    const outputDir = path.join(__dirname, '..', 'public', 'generated');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputFilename = `${Date.now()}-output.mp3`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, response.data);

    const generatedAudioUrl = `/generated/${outputFilename}`;
    res.json({ generatedAudioUrl });
  } catch (err) {
    console.error('Error generating music:', err?.response?.data || err.message || err);
    res.status(500).json({ message: 'Failed to generate music.', detail: err?.response?.data || err.message || err });
  } finally {
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
});

module.exports = router; 