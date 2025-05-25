const express = require('express');
const router = express.Router();
const multer = require('multer');
const Music = require('../models/Music');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { uploadToS3 } = require('../utils/s3');

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
    const { title, description, roomId, isPublic, audioUrl } = req.body;
    
    // 检查是否有文件上传或audioUrl
    if (!req.file && !audioUrl) {
      return res.status(400).json({ message: 'No audio file or URL provided' });
    }

    const newMusic = new Music({
      title,
      description,
      audioUrl: req.file ? req.file.path : audioUrl,
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

    // 如果是本地文件，删除文件
    if (music.audioUrl && !music.audioUrl.startsWith('http')) {
      const filePath = path.join(__dirname, '..', music.audioUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 使用 findByIdAndDelete 替代 remove
    await Music.findByIdAndDelete(req.params.id);

    res.json({ message: 'Music removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 修改生成音乐的路由 - 使用内存存储
router.post('/generate', auth, memoryUpload.single('audio'), async (req, res) => {
  console.log('收到 /api/music/generate 请求');
  const audioFile = req.file;
  console.log('audioFile:', audioFile);

  try {
    const { prompt, duration = 30, output_format = 'mp3', seed, steps = 50, cfg_scale = 7, strength = 0.75 } = req.body;

    if (!audioFile) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    console.log('Sending request to Stability AI API...');
    console.log('Request parameters:', {
      prompt,
      duration,
      output_format,
      steps,
      cfg_scale,
      strength
    });

    // 创建 FormData 对象
    const formData = new FormData();
    formData.append('audio', new Blob([audioFile.buffer], { type: audioFile.mimetype }));
    formData.append('prompt', prompt);
    formData.append('duration', duration);
    formData.append('steps', steps);
    formData.append('cfg_scale', cfg_scale);
    formData.append('output_format', output_format);
    formData.append('strength', strength);
    if (seed) {
      formData.append('seed', seed);
    }

    const response = await fetch('https://api.stability.ai/v2beta/audio/stable-audio-2/audio-to-audio', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'audio/*'
      },
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI API Error:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // 直接获取音频数据
    const audioBuffer = await response.arrayBuffer();
    
    // 生成唯一文件名
    const fileName = `generated_${Date.now()}.${output_format}`;
    
    // 上传到 S3
    const s3Url = await uploadToS3(Buffer.from(audioBuffer), fileName);

    // 创建新的音乐记录
    const newMusic = new Music({
      title: prompt, // 使用提示文本作为标题
      description: `Generated music with prompt: ${prompt}`,
      audioUrl: s3Url,
      creator: req.user.id,
      isPublic: false, // 默认设为私有
      generationParams: {
        prompt,
        duration,
        output_format,
        steps,
        cfg_scale,
        strength,
        seed: response.headers.get('seed')
      }
    });

    await newMusic.save();

    res.json({ 
      message: 'Music generated and saved successfully',
      audioUrl: s3Url,
      music: newMusic
    });

  } catch (error) {
    console.error('Error generating music:', error);
    res.status(500).json({ 
      message: 'Error generating music',
      error: error.message 
    });
  }
});

// PATCH /:id/share - 设置或取消分享至Plaza
router.patch('/:id/share', auth, async (req, res) => {
  try {
    const { sharedToPlaza } = req.body;
    const music = await Music.findById(req.params.id);
    if (!music) return res.status(404).json({ message: 'Music not found' });
    if (music.creator.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    music.sharedToPlaza = !!sharedToPlaza;
    await music.save();
    res.json(music);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /plaza - 获取所有已分享至Plaza的音乐
router.get('/plaza', async (req, res) => {
  try {
    const music = await Music.find({ sharedToPlaza: true }).populate('creator', 'username email');
    res.json(music);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.use((err, req, res, next) => {
  console.error('Router-level error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = router; 