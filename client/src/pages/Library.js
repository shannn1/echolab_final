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
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Download,
  Share,
  Delete,
  Edit,
  ContentCopy,
  Facebook,
  Email,
  WhatsApp,
  ToggleOn,
  ToggleOff,
  Public,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import XIcon from '@mui/icons-material/Close'; // 你可以换成 X 的图标
import { useNavigate } from 'react-router-dom';

const Library = () => {
  const { user, setUser } = useAuth();
  const [music, setMusic] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    isPublic: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 用于存储每个音频的ref
  const audioRefs = useRef({});

  // 限制描述长度
  const MAX_DESC_LENGTH = 36; // "Generated music with prompt: music played by marimba".length = 46, 但36更适合视觉
  const MAX_TITLE_LENGTH = 36;

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareMusic, setShareMusic] = useState(null);

  // 收藏相关
  const [favoriteMusic, setFavoriteMusic] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const favoriteAudioRefs = useRef({});

  const navigate = useNavigate();

  // 当用户信息更新时，更新收藏状态
  useEffect(() => {
    if (user?.favorites) {
      setFavorites(user.favorites);
      fetchFavorites();
    }
  }, [user]);

  useEffect(() => {
    fetchMusic();
    if (user?.favorites) {
      fetchFavorites();
    }
    // 卸载时暂停所有音频
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) audio.pause();
      });
      Object.values(favoriteAudioRefs.current).forEach(audio => {
        if (audio) audio.pause();
      });
    };
  }, []);

  const fetchMusic = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/music/library');
      setMusic(response.data);
    } catch (err) {
      console.error('Error fetching music:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get('/api/music/plaza');
      // 只保留用户收藏的
      if (user?.favorites?.length) {
        const favoriteMusicList = res.data.filter(m => user.favorites.includes(m._id));
        setFavoriteMusic(favoriteMusicList);
      } else {
        setFavoriteMusic([]);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavoriteMusic([]);
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

  const handleShare = (music) => {
    setShareMusic(music);
    setShareUrl(music.audioUrl); // 或者你想分享的完整链接
    setShareOpen(true);
  };

  const handleCloseShare = () => {
    setShareOpen(false);
    setShareMusic(null);
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

  // 收藏区播放/暂停
  const handleFavoritePlayPause = (musicId) => {
    const currentAudio = favoriteAudioRefs.current[musicId];
    if (!currentAudio) return;
    if (playingId === musicId) {
      currentAudio.pause();
      setPlayingId(null);
    } else {
      Object.entries(favoriteAudioRefs.current).forEach(([id, audio]) => {
        if (audio && id !== musicId) audio.pause();
      });
      currentAudio.play();
      setPlayingId(musicId);
    }
  };

  // 收藏/取消收藏
  const handleFavorite = async (musicId, currentIsFav) => {
    try {
      // 计算新的收藏状态（取反）
      const newIsFav = !currentIsFav;
      
      const response = await axios.patch('/api/auth/favorite', {
        musicId,
        action: newIsFav ? 'add' : 'remove'
      });
      
      // 更新本地收藏状态
      const newFavorites = newIsFav
        ? [...favorites, musicId]
        : favorites.filter(id => id !== musicId);
      setFavorites(newFavorites);
      
      // 更新 AuthContext 中的用户信息
      setUser(prevUser => ({
        ...prevUser,
        favorites: newFavorites
      }));

      // 更新收藏音乐列表
      if (newIsFav) {
        const musicToAdd = music.find(m => m._id === musicId);
        if (musicToAdd) {
          setFavoriteMusic(prev => [...prev, musicToAdd]);
        }
      } else {
        setFavoriteMusic(prev => prev.filter(m => m._id !== musicId));
      }
    } catch (err) {
      console.error('Error updating favorite status:', err);
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
                {!isLoading && music.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Your music library is empty
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Start creating your own music or explore the music plaza
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/room/new')}
                        startIcon={<PlayArrow />}
                      >
                        Generate Music
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate('/plaza')}
                        startIcon={<Public />}
                      >
                        Visit Plaza
                      </Button>
                    </Box>
                  </Box>
                ) : (
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
                            onClick={() => handleShare(item)}
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
                          <IconButton
                            edge="end"
                            size="small"
                            sx={{ mx: 0.5 }}
                            onClick={() => handleFavorite(item._id, favorites.includes(item._id))}
                            title={favorites.includes(item._id) ? 'Remove from Favorites' : 'Add to Favorites'}
                          >
                            {favorites.includes(item._id)
                              ? <Favorite color="error" />
                              : <FavoriteBorder />}
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
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

        <Dialog open={shareOpen} onClose={handleCloseShare}>
          <DialogTitle>Share</DialogTitle>
          <DialogContent>
            <List>
              {/* Plaza 分享开关 */}
              {shareMusic && (
                <ListItem>
                  <ListItemIcon>
                    <Public color={shareMusic.sharedToPlaza ? 'primary' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText primary="Plaza" />
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={async () => {
                      const newVal = !shareMusic.sharedToPlaza;
                      await axios.patch(`/api/music/${shareMusic._id}/share`, { sharedToPlaza: newVal });
                      setMusic(music.map(m => m._id === shareMusic._id ? { ...m, sharedToPlaza: newVal } : m));
                      setShareMusic({ ...shareMusic, sharedToPlaza: newVal });
                    }}
                    title={shareMusic.sharedToPlaza ? 'Unshare from Plaza' : 'Share to Plaza'}
                  >
                    {shareMusic.sharedToPlaza ? <ToggleOn color="primary" /> : <ToggleOff />}
                  </IconButton>
                </ListItem>
              )}
              <ListItem button onClick={() => {navigator.clipboard.writeText(shareUrl); handleCloseShare();}}>
                <ListItemIcon>
                  <ContentCopy />
                </ListItemIcon>
                <ListItemText primary="Copy link" sx={{ color: '#fff' }} />
              </ListItem>
              <ListItem button component="a" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                <ListItemIcon>
                  <Facebook />
                </ListItemIcon>
                <ListItemText primary="Facebook" sx={{ color: '#fff' }} />
              </ListItem>
              <ListItem button component="a" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                <ListItemIcon>
                  <span style={{fontSize: 24, fontWeight: 'bold'}}>𝕏</span>
                </ListItemIcon>
                <ListItemText primary="X" sx={{ color: '#fff' }} />
              </ListItem>
              <ListItem button component="a" href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                <ListItemIcon>
                  <WhatsApp />
                </ListItemIcon>
                <ListItemText primary="WhatsApp" sx={{ color: '#fff' }} />
              </ListItem>
              <ListItem button component="a" href={`mailto:?subject=Check out this music&body=${encodeURIComponent(shareUrl)}`}>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText primary="Email" sx={{ color: '#fff' }} />
              </ListItem>
            </List>
          </DialogContent>
        </Dialog>

        {/* 我的收藏区域 */}
        {favoriteMusic.length > 0 && (
          <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>My Favorites</Typography>
            <Paper sx={{ p: 2, mb: 2, maxWidth: 1200, mx: 'auto', bgcolor: '#232323' }}>
              <List>
                {favoriteMusic.map(item => (
                  <ListItem key={item._id} sx={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', borderRadius: 2, mb: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <ListItemText
                        primary={<Box sx={{ fontWeight: 600, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</Box>}
                        secondary={<Box sx={{ color: 'text.secondary', fontSize: 15 }}>{item.description}</Box>}
                      />
                      <Typography variant="caption" color="text.secondary">By: {item.creator?.username || 'Unknown'}</Typography>
                    </Box>
                    <audio
                      ref={el => (favoriteAudioRefs.current[item._id] = el)}
                      src={item.audioUrl}
                      onEnded={() => setPlayingId(null)}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                      <IconButton edge="end" size="small" sx={{ mx: 0.5 }} onClick={() => handleFavoritePlayPause(item._id)}>
                        {playingId === item._id ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                      </IconButton>
                      <IconButton edge="end" size="small" sx={{ mx: 0.5 }} onClick={() => handleFavorite(item._id, favorites.includes(item._id))} title={favorites.includes(item._id) ? 'Remove from Favorites' : 'Add to Favorites'}>
                        {favorites.includes(item._id)
                          ? <Favorite color="error" />
                          : <FavoriteBorder />}
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Library; 