import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Download,
  Save,
  Share,
  Delete,
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const MusicRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [description, setDescription] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [musicHistory, setMusicHistory] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001');
    setSocket(newSocket);

    newSocket.emit('joinRoom', roomId);

    newSocket.on('audioUpdate', (data) => {
      setMusicHistory((prev) => [...prev, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      audioRef.current.src = URL.createObjectURL(file);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSave = async () => {
    if (!audioFile || !description) {
      setError('Please provide both audio file and description');
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('description', description);
    formData.append('roomId', roomId);

    try {
      const response = await axios.post('/api/music', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      socket.emit('audioUpdate', {
        roomId,
        audioUrl: response.data.audioUrl,
        description,
        creator: user.username,
      });

      setMusicHistory((prev) => [...prev, response.data]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving music');
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

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('prompt', description);
      formData.append('duration', 30);
      formData.append('output_format', 'mp3');
      formData.append('steps', 50);
      formData.append('cfg_scale', 7);
      formData.append('strength', 0.75);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/music/generate`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );

      if (response.data.audioUrl) {
        setGeneratedUrl(response.data.audioUrl);
        toast.success('音乐生成成功！');
      }
    } catch (err) {
      console.error('Error generating music:', err);
      setError(err.response?.data?.message || '生成音乐失败，请重试');
      toast.error('生成音乐失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Music Room: {roomId}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Create Music
              </Typography>
              <Box sx={{ mb: 3 }}>
                <input
                  accept="audio/*"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="audio-file"
                />
                <label htmlFor="audio-file">
                  <Button variant="contained" component="span">
                    Upload Audio
                  </Button>
                </label>
                {audioFile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected file: {audioFile.name}
                  </Typography>
                )}
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                  onClick={handlePlayPause}
                  disabled={!audioFile}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={!audioFile || !description}
                >
                  Save
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Music History
              </Typography>
              <List>
                {musicHistory.map((music, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          onClick={() => handleDownload(music.audioUrl)}
                        >
                          <Download />
                        </IconButton>
                        <IconButton edge="end">
                          <Share />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={music.description}
                      secondary={`Created by: ${music.creator}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={!audioFile || !description || isGenerating}
            sx={{ mt: 2 }}
          >
            {isGenerating ? (
              <CircularProgress size={24} />
            ) : (
              'Generate Music'
            )}
          </Button>
        </Box>
        {generatedUrl && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              生成的音乐
            </Typography>
            <audio controls style={{ width: '100%' }}>
              <source src={generatedUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </Box>
        )}
        {isGenerating && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              正在生成音乐，这可能需要一些时间...
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default MusicRoom; 