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
import { MusicNote, Group, CloudDownload } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const audioRef = useRef(null);
  const [audioStarted, setAudioStarted] = useState(false);

  useEffect(() => {
    // 自动播放音乐
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          // 自动播放可能会被浏览器拦截
          // 可以在需要时提示用户点击播放
        });
      }
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
      icon: <CloudDownload sx={{ fontSize: 40 }} />,
      title: 'Save & Share',
      description: 'Download your creations, save them to your library, and share with the community',
    },
  ];

  return (
    <>
      <audio ref={audioRef} src="/sample_home_music.mp3" preload="auto" />
      <Box sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {!audioStarted ? (
          <Button variant="contained" color="primary" onClick={handleStartAudio}>
            ▶️ Play Background Music
          </Button>
        ) : (
          <Button variant="contained" color="secondary" onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            setAudioStarted(false);
          }}>
            ⏹️ Stop Background Music
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
          <Box
            sx={{
              mt: 4,
              mb: 4,
              p: { xs: 2, md: 4 },
              borderRadius: 3,
              color: '#fff',
              position: 'relative',
              height: { xs: 260, md: 320 },
              overflow: 'hidden',
              boxShadow: 3,
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
                opacity: 0.25,
                zIndex: 1,
              }}
            />
            {/* 文字内容可滚动 */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                overflowY: 'auto',
                pr: 2,
              }}
            >
              <Typography variant="h5" gutterBottom>
                What Is Experimental Music?
              </Typography>
              <Typography variant="body1" sx={{ fontSize: { xs: 16, md: 18 } }}>
                Experimental music is an umbrella label for a diverse array of contemporary music, from classical and jazz to electronic music, that differs, often radically, from traditional forms of popular music in its composition, performance, and production. The music style, which dates back to the mid-twentieth century, uses various instruments and production methods, including using non-musical objects to create traditional instruments or sounds and manipulating the instruments or recording through physical or electroacoustic means. The compositional structure may even abandon traditional building blocks like rhythm, melody, timbre, or tempo in favor of free improvisation or total deconstruction.
                <br /><br />
                Though the terms "experimental" and "avant-garde" are sometimes used interchangeably, some music scholars and composers consider avant-garde music, which aims to innovate, as the furthest expression of an established musical form. Experimentalism is entirely separate from any musical form and focuses on discovery and playfulness without an underlying intention.
              </Typography>
              <Box sx={{ mt: 2 }}>
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
          {[features[1], features[2]].map((feature, index) => (
            <Grid item xs={12} md={5} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
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
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default Home; 