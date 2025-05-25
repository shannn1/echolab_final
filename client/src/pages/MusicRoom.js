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
  const [showGenerated, setShowGenerated] = useState(false);
  const [saving, setSaving] = useState(false);

  // 音乐素材库数据
  const musicResources = [
    { label: 'Audio Collage', url: 'https://freemusicarchive.org/genre/Audio_Collage/' },
    { label: 'Avant-Garde', url: 'https://freemusicarchive.org/genre/Avant-Garde/' },
    { label: 'Drone', url: 'https://freemusicarchive.org/genre/Drone/' },
    { label: 'Electroacoustic', url: 'https://freemusicarchive.org/genre/Electroacoustic/' },
    { label: 'Field Recordings', url: 'https://freemusicarchive.org/genre/Field_Recordings/' },
    { label: 'Lo-fi Experimental', url: 'https://freemusicarchive.org/genre/Lo-fi-Experimental/' },
    { label: 'Minimalism', url: 'https://freemusicarchive.org/genre/Minimalism_1456/' },
    { label: 'Musique Concrete', url: 'https://freemusicarchive.org/genre/Musique_Concrete/' },
    { label: 'Noise', url: 'https://freemusicarchive.org/genre/Noise/' },
    { label: 'Sound Art', url: 'https://freemusicarchive.org/genre/Sound_Art/' },
    { label: 'Unclassifiable', url: 'https://freemusicarchive.org/genre/Unclassifiable/' },
  ];

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
        '/api/music/generate',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': localStorage.getItem('token')
          },
          timeout: 120000
        }
      );

      if (response.data.audioUrl) {
        setGeneratedUrl(response.data.audioUrl);
        setShowGenerated(true);
        toast.success('Music generated successfully!');
      }
    } catch (err) {
      console.error('Error generating music:', err);
      setError(err.response?.data?.message || 'Music generation failed. Please try again.');
      toast.error('Music generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存生成音乐到library
  const handleSaveGenerated = async () => {
    if (!generatedUrl) return;
    setSaving(true);
    try {
      const response = await axios.post(
        '/api/music',
        {
          title: description || 'Generated Music',
          description: `Generated music with prompt: ${description}`,
          audioUrl: generatedUrl,
          isPublic: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );
      toast.success('Music saved to your library!');
      setShowGenerated(false);
      setGeneratedUrl('');
    } catch (err) {
      toast.error('Failed to save music to library.');
    } finally {
      setSaving(false);
    }
  };

  // 放弃生成音乐
  const handleDiscardGenerated = () => {
    setShowGenerated(false);
    setGeneratedUrl('');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mt: 4, display: 'flex', alignItems: 'flex-start' }}>
        {/* 主内容区 */}
        <Box sx={{ flex: 1, pr: { md: 4 } }}>
          <Typography variant="h4" gutterBottom>
            Music Room: {roomId}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Paper sx={{ p: 3, mb: 3 }}>
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
                {isPlaying ? 'Pause Uploaded Audio' : 'Play Uploaded Audio'}
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
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={!audioFile || !description || isGenerating}
                sx={{ mt: 2 }}
                title="Generating music will consume your token upon success."
              >
                {isGenerating ? (
                  <CircularProgress size={24} />
                ) : (
                  'Generate Music'
                )}
              </Button>
            </Box>
            {showGenerated && generatedUrl && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Music Generated
                </Typography>
                <audio controls style={{ width: '100%' }}>
                  <source src={generatedUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveGenerated}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save to Library'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDiscardGenerated}
                  >
                    Discard
                  </Button>
                </Box>
              </Box>
            )}
            {isGenerating && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>
                  Generating music, this may take a while...
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
        {/* 右侧Resource Library固定宽度 */}
        <Box sx={{ width: { xs: '100%', md: 320 }, minWidth: 240, maxWidth: 400 }}>
          <Paper sx={{ p: 2, mb: 2, position: 'sticky', top: 32 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Music Resource Library
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {musicResources.map((item) => (
                <Button
                  key={item.label}
                  variant="outlined"
                  color="primary"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    justifyContent: 'flex-start',
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    textTransform: 'none',
                    mb: 1,
                    background: '#fff',
                    color: '#222',
                    '&:hover': { background: '#f5f5f5' },
                  }}
                  fullWidth
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default MusicRoom; 