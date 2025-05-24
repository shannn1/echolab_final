const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Create a new room
router.post('/', auth, async (req, res) => {
  try {
    const roomId = Math.random().toString(36).substring(2, 8);
    res.json({ roomId });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get room info
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    res.json({ roomId });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 