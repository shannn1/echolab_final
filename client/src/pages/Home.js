import React from 'react';
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

      <Grid container spacing={4} sx={{ mb: 8 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
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
  );
};

export default Home; 