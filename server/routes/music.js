const express = require('express');
const router = express.Router();
const multer = require('multer');
const Music = require('../models/Music');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { uploadToS3 } = require('../index');

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for audio file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// 为不同的路由使用不同的 storage
const diskUpload = multer({ storage: storage });
const memoryUpload = multer({ storage: multer.memoryStorage() });

// Create new music - 使用磁盘存储
router.post('/', auth, diskUpload.single('audio'), async (req, res) => {
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

// 修改生成音乐的路由 - 使用内存存储
router.post('/generate', memoryUpload.single('audio'), async (req, res) => {
  console.log('收到 /api/music/generate 请求');
  const audioFile = req.file;
  console.log('audioFile:', audioFile);

  try {
    const { prompt, duration = 30, output_format = 'mp3', seed, steps = 50, cfg_scale = 7, strength = 0.75 } = req.body;

    if (!audioFile) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    // 使用原生 Web API FormData
    const formData = new FormData();
    formData.append('prompt', prompt);
    
    // 创建 File 对象
    const file = new File([audioFile.buffer], audioFile.originalname, {
      type: audioFile.mimetype
    });
    formData.append('audio', file);
    
    // 确保所有非文件字段都是字符串
    formData.append('duration', String(duration));
    formData.append('output_format', output_format);
    formData.append('seed', String(seed));
    formData.append('steps', String(steps));
    formData.append('cfg_scale', String(cfg_scale));
    formData.append('strength', String(strength));

    console.log('Sending request to Stability AI API...');
    const response = await fetch('https://api.stability.ai/v2beta/audio-to-audio', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'audio/*'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    console.log('Received response from Stability AI API');

    // 生成唯一文件名
    const fileName = `generated_${Date.now()}.${output_format}`;
    
    // 上传到 S3
    const s3Url = await uploadToS3(Buffer.from(buffer), fileName);

    res.json({ 
      message: 'Music generated successfully',
      audioUrl: s3Url
    });

  } catch (error) {
    console.error('Error generating music:', error);
    res.status(500).json({ 
      message: 'Error generating music',
      error: error.message 
    });
  }
});

router.use((err, req, res, next) => {
  console.error('Router-level error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = router; 