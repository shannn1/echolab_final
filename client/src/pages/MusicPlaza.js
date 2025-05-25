import React, { useEffect, useState, useRef } from 'react';
import {
  Container, Typography, Box, Button, Chip, Dialog, DialogTitle, DialogContent, IconButton, Tooltip, List, ListItem, ListItemText
} from '@mui/material';
import { PlayArrow, Pause, Favorite, FavoriteBorder, Email } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MOODS = [
  'Uplifting', 'Epic', 'Powerful', 'Exciting', 'Happy', 'Funny', 'Carefree', 'Hopeful', 'Love', 'Playful', 'Groovy', 'Sexy',
  'Peaceful', 'Mysterious', 'Serious', 'Dramatic', 'Angry', 'Tense', 'Sad', 'Scary', 'Dark'
];
const INSTRUMENTS = [
  'Acoustic Drums', 'Acoustic Guitar', 'Backing Vocals', 'Bass', 'Bells', 'Brass', 'Claps & Snaps', 'Electric Guitar',
  'Electronic Drums', 'Ethnic', 'Keys', 'Mandolin & Ukulele', 'Orchestra', 'Pads', 'Percussion', 'Piano',
  'Special Wind Instruments', 'Strings', 'Synth', 'Vocal', 'Whistle', 'Woodwinds'
];

const MusicPlaza = () => {
  const { user } = useAuth();
  const [musicList, setMusicList] = useState([]);
  const [favorites, setFavorites] = useState(user?.favorites || []);
  const [playingId, setPlayingId] = useState(null);
  const [emailDialog, setEmailDialog] = useState({ open: false, email: '' });
  const audioRefs = useRef({});
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedInstruments, setSelectedInstruments] = useState([]);

  useEffect(() => {
    fetchPlaza();
  }, []);

  const fetchPlaza = async () => {
    const res = await axios.get('/api/music/plaza');
    setMusicList(res.data);
  };

  const handlePlayPause = (id, url) => {
    if (playingId === id) {
      audioRefs.current[id]?.pause();
      setPlayingId(null);
    } else {
      Object.values(audioRefs.current).forEach(a => a && a.pause());
      audioRefs.current[id].play();
      setPlayingId(id);
    }
  };

  const handleFavorite = async (musicId, isFav) => {
    await axios.patch('/api/auth/favorite', { musicId, action: isFav ? 'remove' : 'add' });
    setFavorites(prev => isFav ? prev.filter(id => id !== musicId) : [...prev, musicId]);
  };

  const filteredList = musicList.filter(item => {
    // 可扩展：根据mood/instrument筛选
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 6, position: 'relative', minHeight: '100vh' }}>
      {/* 顶部背景图片，底部在音乐列表上方 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: { xs: 340, md: 420 }, // 覆盖到instrument筛选区下方
          zIndex: 0,
          background: `url('/pic3.png') center/cover no-repeat`,
          opacity: 0.28,
          pointerEvents: 'none',
        }}
      />
      {/* 内容区 */}
      <Box sx={{ position: 'relative', zIndex: 1, pt: { xs: 10, md: 14 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Music Plaza</Typography>
        <Box sx={{ display: 'flex', gap: 4, mb: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Mood</Typography>
            {MOODS.map(mood => (
              <Chip
                key={mood}
                label={mood}
                clickable
                color={selectedMoods.includes(mood) ? 'primary' : 'default'}
                onClick={() => setSelectedMoods(selectedMoods.includes(mood) ? selectedMoods.filter(m => m !== mood) : [...selectedMoods, mood])}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Instrument</Typography>
            {INSTRUMENTS.map(inst => (
              <Chip
                key={inst}
                label={inst}
                clickable
                color={selectedInstruments.includes(inst) ? 'primary' : 'default'}
                onClick={() => setSelectedInstruments(selectedInstruments.includes(inst) ? selectedInstruments.filter(i => i !== inst) : [...selectedInstruments, inst])}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
          {/* 可扩展Filter区 */}
        </Box>
        {/* 音乐列表上方加margin，避免被背景图片遮挡 */}
        <Box sx={{ mt: { xs: 2, md: 4 } }} />
        <List>
          {filteredList.map(item => (
            <ListItem key={item._id} sx={{ bgcolor: '#232323', borderRadius: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => handlePlayPause(item._id, item.audioUrl)}>
                {playingId === item._id ? <Pause /> : <PlayArrow />}
              </IconButton>
              <audio
                ref={el => (audioRefs.current[item._id] = el)}
                src={item.audioUrl}
                onEnded={() => setPlayingId(null)}
                style={{ display: 'none' }}
              />
              <ListItemText
                primary={<Typography sx={{ fontWeight: 600 }}>{item.title}</Typography>}
                secondary={<Typography sx={{ color: 'text.secondary' }}>{item.description}</Typography>}
                sx={{ minWidth: 200 }}
              />
              <Tooltip title={favorites.includes(item._id) ? 'Remove from Favorites' : 'Add to Favorites'}>
                <IconButton onClick={() => handleFavorite(item._id, favorites.includes(item._id))}>
                  {favorites.includes(item._id) ? <Favorite color="error" /> : <FavoriteBorder />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Contact Author">
                <IconButton onClick={() => setEmailDialog({ open: true, email: item.creator?.email || '' })}>
                  <Email />
                </IconButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
        <Dialog open={emailDialog.open} onClose={() => setEmailDialog({ open: false, email: '' })}>
          <DialogTitle>Contact Author</DialogTitle>
          <DialogContent>
            <Typography>Email: {emailDialog.email}</Typography>
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
};

export default MusicPlaza; 