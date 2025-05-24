import React, { useState, useEffect } from 'react';
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
  const [isPlaying, setIsPlaying] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    isPublic: true,
  });

  useEffect(() => {
    fetchMusic();
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
    if (isPlaying === musicId) {
      setIsPlaying(null);
    } else {
      setIsPlaying(musicId);
    }
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
                  <ListItem key={item._id}>
                    <ListItemText
                      primary={item.title}
                      secondary={item.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handlePlayPause(item._id)}
                      >
                        {isPlaying === item._id ? <Pause /> : <PlayArrow />}
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDownload(item.audioUrl)}
                      >
                        <Download />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleShare(item._id)}>
                        <Share />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleEdit(item)}>
                        <Edit />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDelete(item._id)}>
                        <Delete />
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