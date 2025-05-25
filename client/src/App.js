import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MusicRoom from './pages/MusicRoom';
import Library from './pages/Library';
import AccountPage from './pages/Account';
import MusicPlaza from './pages/MusicPlaza';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Box } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Toaster position="top-right" />
        <Router>
          <Navbar />
          <Box sx={{ pt: { xs: 7, md: 8 } }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/room/:roomId" element={<MusicRoom />} />
              <Route path="/library" element={<Library />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/plaza" element={<MusicPlaza />} />
            </Routes>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
