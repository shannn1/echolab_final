import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Download,
  Share,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Library = () => {
  const { user } = useAuth();
  const [music, setMusic] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    isPublic: true,
  });

  // 用于存储每个音频的ref
  const audioRefs = useRef({});

  // 限制描述长度
  const MAX_DESC_LENGTH = 36; // "Generated music with prompt: music played by marimba".length = 46, 但36更适合视觉
  const MAX_TITLE_LENGTH = 36;

  useEffect(() => {
    fetchMusic();
    // 卸载时暂停所有音频
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) audio.pause();
      });
    };
  }, []);

  const fetchMusic = async () => {
    try {
      const response = await axios.get('/api/music/library');
      setMusic(response.data);
    } catch (err) {
      console.error('Error fetching music:', err);
    }
  };

  const handlePlayPause = (musicId) => {
    const currentAudio = audioRefs.current[musicId];
    if (!currentAudio) return;

    // 如果当前正在播放，暂停
    if (playingId === musicId) {
      currentAudio.pause();
      setPlayingId(null);
    } else {
      // 先暂停所有音频
      Object.entries(audioRefs.current).forEach(([id, audio]) => {
        if (audio && id !== musicId) audio.pause();
      });
      currentAudio.play();
      setPlayingId(musicId);
    }
  };

  // 当音频播放结束时，重置播放状态
  const handleAudioEnded = () => {
    setPlayingId(null);
  };

  const handleDownload = (audioUrl) => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = 'music.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (musicId) => {
    try {
      await axios.post(`/api/music/${musicId}/share`);
      // Handle successful share
    } catch (err) {
      console.error('Error sharing music:', err);
    }
  };

  const handleDelete = async (musicId) => {
    try {
      await axios.delete(`/api/music/${musicId}`);
      setMusic(music.filter((m) => m._id !== musicId));
    } catch (err) {
      console.error('Error deleting music:', err);
    }
  };

  const handleEdit = (music) => {
    setSelectedMusic(music);
    setEditForm({
      title: music.title,
      description: music.description,
      isPublic: music.isPublic,
    });
    setEditDialog(true);
  };

  const handleEditSubmit = async () => {
    try {
      const response = await axios.put(`/api/music/${selectedMusic._id}`, editForm);
      setMusic(music.map((m) => (m._id === selectedMusic._id ? response.data : m)));
      setEditDialog(false);
    } catch (err) {
      console.error('Error updating music:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* 右侧图片1 */}
      <Box
        sx={{
          position: 'absolute',
          top: 32,
          right: 32,
          width: { xs: '100%', md: 400 },
          height: { xs: 200, md: '40%' },
          zIndex: 0,
          pointerEvents: 'none',
          background: `linear-gradient(to left, #000 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0) 100%), url('/pic1.png') center right/cover no-repeat`,
          borderRadius: 4,
        }}
      />
      {/* 右侧图片2 */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 250, md: 'calc(32px + 45%)' },
          right: 32,
          width: { xs: '100%', md: 400 },
          height: { xs: 200, md: '40%' },
          zIndex: 0,
          pointerEvents: 'none',
          background: `linear-gradient(to left, #000 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0) 100%), url('/pic2.png') center right/cover no-repeat`,
          borderRadius: 4,
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Music Library
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
                <List>
                  {music.map((item) => (
                    <ListItem key={item._id} sx={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                maxWidth: 340,
                                fontWeight: 600,
                                fontSize: 17,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              component="div"
                            >
                              {item.title && item.title.length > MAX_TITLE_LENGTH
                                ? item.title.slice(0, MAX_TITLE_LENGTH) + '...'
                                : item.title}
                            </Box>
                          }
                          secondary={
                            <Box
                              sx={{
                                maxWidth: 340,
                                fontSize: 15,
                                color: 'text.secondary',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'normal',
                                pr: 1,
                              }}
                              component="div"
                            >
                              {item.description}
                            </Box>
                          }
                        />
                      </Box>
                      {/* 隐藏的audio标签 */}
                      <audio
                        ref={el => (audioRefs.current[item._id] = el)}
                        src={item.audioUrl}
                        onEnded={handleAudioEnded}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <IconButton
                          edge="end"
                          size="small"
                          sx={{ mx: 0.5 }}
                          onClick={() => handlePlayPause(item._id)}
                        >
                          {playingId === item._id ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          sx={{ mx: 0.5 }}
                          onClick={() => handleDownload(item.audioUrl)}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          sx={{ mx: 0.5 }}
                          onClick={() => handleShare(item._id)}
                        >
                          <Share fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          sx={{ mx: 0.5 }}
                          onClick={() => handleEdit(item)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          sx={{ mx: 0.5 }}
                          onClick={() => handleDelete(item._id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
          <DialogTitle>Edit Music</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              margin="normal"
              multiline
              rows={4}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Library; 