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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Music Library
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <List>
                {music.map((item) => (
                  <ListItem key={item._id} sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={item.title}
                      secondary={item.description}
                    />
                    {/* 隐藏的audio标签 */}
                    <audio
                      ref={el => (audioRefs.current[item._id] = el)}
                      src={item.audioUrl}
                      onEnded={handleAudioEnded}
                    />
                    <ListItemSecondaryAction>
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
                    </ListItemSecondaryAction>
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
    </Container>
  );
};

export default Library; 