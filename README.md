# EchoLab - Experimental Music Creation Platform

EchoLab is a web-based platform that allows users to create, collaborate, and share experimental music using Stable Audio 2.0. Users can upload audio files, add text descriptions, and create unique musical compositions in real-time collaboration rooms.

## Features

- User authentication and profile management
- Real-time music collaboration rooms
- Audio file upload and playback
- Text-based music description and generation
- Music library management
- Download and share functionality
- Integration with Stable Audio 2.0 for AI-powered music generation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Stable Audio 2.0 API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/echolab.git
cd echolab
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
```

4. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/echolab
JWT_SECRET=your_jwt_secret_key
STABLE_AUDIO_API_KEY=your_stable_audio_api_key
```

## Running the Application

1. Start the MongoDB server:
```bash
mongod
```

2. Start the backend server (from the root directory):
```bash
npm run dev
```

3. Start the frontend development server (from the client directory):
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Register a new account or login with existing credentials
2. Create or join a music room
3. Upload audio files and add descriptions
4. Collaborate with other users in real-time
5. Save your creations to your library
6. Download and share your music

## Technologies Used

- Frontend:
  - React
  - Material-UI
  - Socket.io-client
  - Axios

- Backend:
  - Node.js
  - Express
  - MongoDB
  - Socket.io
  - JWT Authentication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 