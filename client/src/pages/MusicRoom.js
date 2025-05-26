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
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Download,
  Save,
  Share,
  Delete,
  Edit,
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
  const [generatedList, setGeneratedList] = useState([]); // [{url, description, isSaved}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [musicHistory, setMusicHistory] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerated, setShowGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refineDescription, setRefineDescription] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState('');

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
      // 清理未保存的音乐和上传的音乐
      generatedList.forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
      if (audioFile) setAudioFile(null);
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
    formData.append('title', description || (audioFile && audioFile.name) || 'Untitled');
    if (roomId && roomId !== 'new') {
      formData.append('roomId', roomId);
    }

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

  // 初次生成音乐
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
        setGeneratedList([{ url: response.data.audioUrl, description, isSaved: false }]);
        setRefineDescription('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Music generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // refine
  const handleRefine = async () => {
    setRefineLoading(true);
    setRefineError('');
    try {
      const prev = generatedList[generatedList.length - 1];
      const formData = new FormData();
      const responseAudio = await fetch(prev.url);
      const audioBlob = await responseAudio.blob();
      formData.append('audio', audioBlob, 'prev.mp3');
      formData.append('prompt', refineDescription);
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
        setGeneratedList([
          ...generatedList,
          { url: response.data.audioUrl, description: refineDescription, isSaved: false }
        ]);
        setRefineDescription('');
      }
    } catch (err) {
      setRefineError('Music generation failed. Please try again.');
    } finally {
      setRefineLoading(false);
    }
  };

  // 保存最新一轮生成音乐到library
  const handleSaveGenerated = async () => {
    const last = generatedList[generatedList.length - 1];
    setSaving(true);
    try {
      await axios.post(
        '/api/music',
        {
          title: last.description || 'Generated Music',
          description: `Generated music with prompt: ${last.description}`,
          audioUrl: last.url,
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
      setGeneratedList(generatedList.map((item, idx) =>
        idx === generatedList.length - 1 ? { ...item, isSaved: true } : item
      ));
    } catch (err) {
      toast.error('Failed to save music to library.');
    } finally {
      setSaving(false);
    }
  };

  // 丢弃最新一轮生成音乐
  const handleDiscard = () => {
    setGeneratedList(generatedList.slice(0, -1));
    setRefineDescription('');
    setRefineError('');
  };

  // 点击Refine Music时清空输入框
  const handleRefineMusicClick = () => {
    setRefineDescription('');
    setRefineError('');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mt: 4, display: 'flex', alignItems: 'flex-start' }}>
        {/* 主内容区 */}
        <Box sx={{ flex: 1, pr: { md: 4 } }}>
          <Typography variant="h4" gutterBottom>
            Music Room: {roomId}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            To generate music, please upload an <b>audio sample</b> and provide a natural language description. <br />
            The audio sample can include sound effects, styles, or any elements you want the model to learn from.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Paper sx={{ p: 3, mb: 3, position: 'relative', overflow: 'hidden',
            backgroundImage: 'url(/pic6.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            '::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'rgba(30,30,30,0.45)',
              zIndex: 1,
            }
          }}>
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Typography variant="h6" gutterBottom>
                Create Music
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <label htmlFor="audio-file">
                  <Button variant="contained" component="span">
                    Upload Audio
                  </Button>
                </label>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  Supported Formats: mp3, wav<br />
                  Audio must be between 6 and 190 seconds long
                </Typography>
              </Box>
              <input
                accept="audio/*"
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="audio-file"
              />
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
              {isGenerating && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>
                    Generating music, this may take a while...
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* 多轮生成音乐展示区 */}
          {generatedList.map((item, idx) => (
            <Box key={idx} sx={{ mt: 4, mb: 4, p: 3, borderRadius: 3, position: 'relative', overflow: 'hidden',
              backgroundImage: 'url(/pic6.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              '::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                bgcolor: 'rgba(30,30,30,0.45)',
                zIndex: 1,
              }
            }}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Music Generated {idx + 1}
                </Typography>
                <audio controls style={{ width: '100%' }}>
                  <source src={item.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Prompt: {item.description}
                </Typography>
                {/* 只在最后一项下方显示操作区 */}
                {idx === generatedList.length - 1 && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveGenerated}
                      disabled={item.isSaved || saving}
                      startIcon={<Save />}
                    >
                      {saving ? 'Saving...' : item.isSaved ? 'Saved' : 'Save to Library'}
                    </Button>
                    <Tooltip title={item.isSaved ? '' : 'Please save to library first'}>
                      <span>
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<Edit />}
                          disabled={!item.isSaved || refineLoading}
                          onClick={handleRefineMusicClick}
                          sx={{ ml: 1 }}
                        >
                          Refine Music
                        </Button>
                      </span>
                    </Tooltip>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={handleDiscard}
                      sx={{ ml: 1 }}
                    >
                      Discard
                    </Button>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="New Description"
                      value={refineDescription}
                      onChange={e => setRefineDescription(e.target.value)}
                      sx={{ mt: 2 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleRefine}
                      disabled={refineLoading || !refineDescription}
                      sx={{ mt: 1 }}
                    >
                      {refineLoading ? <CircularProgress size={22} /> : 'Generate Music'}
                    </Button>
                    {refineLoading && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <CircularProgress size={22} />
                        <Typography sx={{ ml: 2 }}>Generating music, this may take a while...</Typography>
                      </Box>
                    )}
                    {refineError && <Typography color="error">{refineError}</Typography>}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
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