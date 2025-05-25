import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
} from '@mui/material';
import { MusicNote, Group, CloudDownload, Public } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const audioRef = useRef(null);
  const [audioStarted, setAudioStarted] = useState(false);

  useEffect(() => {
    // 首页打开时默认播放背景音乐
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          // 自动播放可能会被浏览器拦截
        });
      }
      setAudioStarted(true); // 默认已播放
    }
  }, []);

  const handleStartAudio = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play();
      setAudioStarted(true);
    }
  };

  const features = [
    {
      icon: <MusicNote sx={{ fontSize: 40 }} />,
      title: 'Create Music',
      description: 'Upload audio and use text descriptions to create unique experimental music with Stable Audio 2.0',
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'Collaborate',
      description: 'Join music rooms and collaborate with other artists in real-time',
    },
    {
      icon: <Public sx={{ fontSize: 40 }} />,
      title: 'Music Plaza',
      description: 'Explore and favorite music shared by users on the platform',
    },
  ];

  return (
    <>
      <audio ref={audioRef} src="/sample_home_music.mp3" preload="auto" />
      <Box sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {audioStarted ? (
          <Button variant="contained" color="secondary" onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            setAudioStarted(false);
          }}>
            ⏹️ Stop Background Music
          </Button>
        ) : (
          <Button variant="contained" color="primary" onClick={handleStartAudio}>
            ▶️ Play Background Music
          </Button>
        )}
      </Box>
      <Container maxWidth="lg">
        <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Welcome to EchoLab
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Create, collaborate, and share experimental music with AI
          </Typography>
          {!user && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ mt: 2 }}
            >
              Get Started
            </Button>
          )}
        </Box>

        <Box
          sx={{
            position: 'relative',
            px: { xs: 2, md: 8 },
            py: { xs: 6, md: 10 },
            backgroundColor: '#18181b',
            color: '#fff',
            borderRadius: 3,
            mb: 6,
            mt: 4,
            overflow: 'hidden',
          }}
        >
          {/* 背景图片 */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              background: `url('/keyboard.png') center/cover no-repeat`,
              opacity: 0.18,
              zIndex: 1,
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                textAlign: 'center',
                mb: 6,
                fontSize: { xs: 28, md: 36 },
              }}
            >
              What Is Experimental Music?
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {/* Definition 居中显示 */}
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    backgroundColor: '#27272a',
                    p: 3,
                    borderRadius: 4,
                    boxShadow: 3,
                    mb: 4,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Definition
                  </Typography>
                  <Typography sx={{ color: '#d1d5db' }}>
                    Music that <strong>pushes boundaries</strong> of traditional form—exploring new sounds, structures and performance methods.
                  </Typography>
                </Box>
              </Grid>
              {/* 其余分栏 */}
              <Grid item xs={12} sm={6} md={2}>
                <Box
                  sx={{
                    backgroundColor: '#27272a',
                    p: 3,
                    borderRadius: 4,
                    boxShadow: 3,
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Origins
                  </Typography>
                  <ul style={{ color: '#d1d5db', paddingLeft: 18, margin: 0 }}>
                    <li>Mid-20th-century avant-garde</li>
                    <li>Pioneers: John Cage, Stockhausen…</li>
                  </ul>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box
                  sx={{
                    backgroundColor: '#27272a',
                    p: 3,
                    borderRadius: 4,
                    boxShadow: 3,
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Techniques
                  </Typography>
                  <ul style={{ color: '#d1d5db', paddingLeft: 18, margin: 0 }}>
                    <li>Free improvisation</li>
                    <li>Musique concrète (found sounds)</li>
                    <li>Electronic & tape manipulation</li>
                  </ul>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box
                  sx={{
                    backgroundColor: '#27272a',
                    p: 3,
                    borderRadius: 4,
                    boxShadow: 3,
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Key Elements
                  </Typography>
                  <ul style={{ color: '#d1d5db', paddingLeft: 18, margin: 0 }}>
                    <li>Unconventional instruments</li>
                    <li>Non-musical objects</li>
                    <li>Electroacoustic effects</li>
                  </ul>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                href="https://www.masterclass.com/articles/experimental-music-guide"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more on MasterClass
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Card sx={{ width: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
              <Box sx={{ mb: 2 }}>{features[0].icon}</Box>
              <Typography gutterBottom variant="h5" component="h2">
                {features[0].title}
              </Typography>
              <Typography color="text.secondary">
                {features[0].description}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(user ? '/room/new' : '/login')}
              >
                Try it now
              </Button>
            </CardActions>
          </Card>
        </Box>

        <Grid container spacing={4} sx={{ mb: 8, justifyContent: 'center' }}>
          {/* Collaborate按钮置灰并加提示 */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>{features[1].icon}</Box>
                <Typography gutterBottom variant="h5" component="h2">
                  {features[1].title}
                </Typography>
                <Typography color="text.secondary">
                  {features[1].description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="outlined"
                  disabled
                  sx={{ cursor: 'not-allowed' }}
                  title="This feature will be supported in the future."
                >
                  Try it now
                </Button>
              </CardActions>
            </Card>
          </Grid>
          {/* Save & Share按钮正常 */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>{features[2].icon}</Box>
                <Typography gutterBottom variant="h5" component="h2">
                  {features[2].title}
                </Typography>
                <Typography color="text.secondary">
                  {features[2].description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/plaza')}
                >
                  Explore Plaza
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Home; 