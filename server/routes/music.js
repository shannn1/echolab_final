const express = require('express');
const router = express.Router();
const multer = require('multer');
const Music = require('../models/Music');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { uploadToS3 } = require('../index');

// 确保 temp 目录存在
const tempDir = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for audio file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
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

    const formData = new FormData();
    formData.append('prompt', prompt);
    
    // 创建临时文件
    const tempFilePath = path.join(tempDir, `${Date.now()}-${audioFile.originalname}`);
    fs.writeFileSync(tempFilePath, audioFile.buffer);
    
    // 使用文件流，并确保提供完整的文件信息
    const fileStream = fs.createReadStream(tempFilePath);
    formData.append('audio', fileStream, {
      filename: audioFile.originalname,
      contentType: audioFile.mimetype,
      knownLength: audioFile.size
    });
    
    formData.append('duration', duration);
    formData.append('output_format', output_format);
    formData.append('seed', seed);
    formData.append('steps', steps);
    formData.append('cfg_scale', cfg_scale);
    formData.append('strength', strength);

    console.log('Temp file path:', tempFilePath);
    console.log('File exists:', fs.existsSync(tempFilePath));
    console.log('File size:', fs.statSync(tempFilePath).size);
    console.log('File stream created:', !!fileStream);

    const response = await axios.post('https://api.stability.ai/v2beta/audio-to-audio', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'audio/*'
      },
      responseType: 'arraybuffer'
    });

    // 生成唯一文件名
    const fileName = `generated_${Date.now()}.${output_format}`;
    
    // 上传到 S3
    const s3Url = await uploadToS3(response.data, fileName);

    // 清理临时文件
    fs.unlinkSync(tempFilePath);

    res.json({ 
      message: 'Music generated successfully',
      audioUrl: s3Url
    });

  } catch (error) {
    console.error('Error generating music:', error);
    // 确保在错误时也清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
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

axios.defaults.timeout = 120000;

module.exports = router; 