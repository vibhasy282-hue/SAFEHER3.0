# SafeHer - AI Powered Women Safety Platform

A production-ready, full-stack AI safety platform designed for women. Detects danger via voice, emotion, gestures, and keyboard shortcuts — then instantly triggers SOS, records evidence, alerts guardians, and shares live location.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB (Mongoose 8) |
| Auth | JWT (access + refresh tokens), Bcrypt |
| AI/ML | face-api.js, Web Speech API, TensorFlow.js patterns |
| Maps | Google Maps API, Directions API, Places API |
| Cloud | Cloudinary (encrypted evidence storage) |
| Alerts | Twilio SMS, Nodemailer Email, Socket.IO push |
| Security | Helmet.js, Rate Limiting, AES Encryption, CORS |
| DevOps | Docker, Docker Compose |

## Architecture

```
safeher/
├── backend/
│   ├── src/
│   │   ├── ai/               # Voice, emotion, gesture analyzers
│   │   ├── controllers/      # Auth, emergency, contacts, locations, recordings, alerts, AI
│   │   ├── middleware/       # JWT auth, error handler, file upload
│   │   ├── models/           # User, EmergencyLog, Contact, Location, Recording, Alert
│   │   ├── routes/           # REST API routes
│   │   ├── services/         # Cloudinary uploads, Twilio/Nodemailer alerts
│   │   ├── socket/           # Real-time location, emergency, webcam events
│   │   └── utils/            # DB connector, encryption, Winston logger
│   ├── uploads/
│   ├── logs/
│   ├── server.js
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router (pages)
│   │   ├── components/       # SOSButton, VoiceDetector, WebcamMonitor, LiveMap, SafeRoute, EvidenceRecorder, GuardianDashboard, etc.
│   │   ├── hooks/            # useVoiceDetection, useWebcam, useSocket, useLocationTracker
│   │   ├── context/          # AuthContext
│   │   ├── lib/              # Axios API client
│   │   └── types/            # TypeScript interfaces
│   ├── public/
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas cluster (or local MongoDB)
- Google Maps API key (for maps & safe routes)
- Cloudinary account (for evidence uploads)
- (Optional) Twilio account for SMS alerts
- (Optional) SMTP credentials for email alerts

### 1. Clone & Enter

```bash
cd "safe her _ Complete"
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in the required values:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB (replace with your Atlas URI or local MongoDB)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/safeher?retryWrites=true&w=majority

# JWT (generate strong random strings)
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key

# Cloudinary (get from https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Maps (get from https://console.cloud.google.com)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Encryption (32 character key)
ENCRYPTION_KEY=your_32_character_encryption_key
```

Optional fields (Twilio, SMTP) can be left empty — the app will skip SMS/email gracefully.

Install and run:

```bash
npm install
npm run dev
```

Backend will start on `http://localhost:5000`. You should see:

```
MongoDB Connected: <host>
SafeHer server running on port 5000
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Install and run:

```bash
npm install
npm run dev
```

Frontend will start on `http://localhost:3000`.

### 4. Verify

- Open `http://localhost:3000`
- Create an account on `/signup`
- Log in and visit `/dashboard`
- Enable voice detection, webcam monitoring, and location tracking
- Test the SOS button, keyboard shortcuts (`Ctrl+Alt+S`), and safe routes

## Docker Deployment

Make sure Docker Desktop is running, then:

```bash
docker-compose up --build
```

This builds and starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:3000`
- MongoDB on `localhost:27017`

To stop:

```bash
docker-compose down
```

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/logout` | Logout and clear session |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile/settings |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Emergency

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergency/sos` | Trigger SOS alert |
| POST | `/api/emergency/resolve` | Mark emergency as resolved |
| GET | `/api/emergency/history` | Get user's emergency history |
| GET | `/api/emergency/:id` | Get single emergency details |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List emergency contacts |
| POST | `/api/contacts` | Add new contact |
| PUT | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/locations/update` | Update current location |
| GET | `/api/locations/history` | Location history with pagination |
| GET | `/api/locations/current` | Get latest location |
| GET | `/api/locations/safe-spots` | Nearby safe spots |
| GET | `/api/locations/tracking/:userId` | Guardian tracking view |

### Recordings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recordings/upload-base64` | Upload base64 evidence |
| GET | `/api/recordings` | List recordings |
| DELETE | `/api/recordings/:id` | Delete recording |

### AI Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/voice` | Analyze voice transcript |
| POST | `/api/ai/emotion` | Analyze facial emotions |
| POST | `/api/ai/gesture` | Analyze hand gestures |
| POST | `/api/ai/event` | Process AI-detected emergency event |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get all alerts |
| GET | `/api/alerts/guardian` | Guardian alert feed |
| PUT | `/api/alerts/:id/status` | Update alert status |

## Core Safety Features

### 1. AI Voice Distress Detection
- Uses Web Speech API for continuous speech recognition
- Detects distress keywords: "help", "save me", "emergency", "danger", "stop", etc.
- Analyzes panic tone indicators (pitch, volume, speed)
- Auto-triggers SOS when confidence > 70%

### 2. Webcam Emotion Detection
- Uses **face-api.js** with TinyFaceDetector + FaceExpressionNet
- Detects fear, sadness, anger, surprise in real-time
- Draws face bounding boxes and emotion overlays on canvas
- Falls back to simulation if models fail to load (for demo/development)
- Records video evidence directly from webcam stream

### 3. Hand Gesture SOS
- Detects open palm + repeated waving motion
- Triggers silent SOS alert without sound

### 4. Secret Keyboard SOS
- `Ctrl + Alt + S` → instant silent SOS
- Rapidly press `Shift` 5 times → silent SOS
- Works globally while on the SafeHer site

### 5. Live Location Tracking
- Browser geolocation `watchPosition` sends updates every few seconds
- Socket.IO broadcasts to guardians in real-time
- Stores location history with TTL (7 days auto-cleanup)

### 6. Safe Route AI
- Google Maps Directions API with walking mode
- Displays safety score for each route
- Shows nearby police stations, hospitals, crowded areas
- Dark-themed custom map styling

### 7. Emergency Contact System
- Add trusted contacts with phone, email, relationship
- Set guardians who receive real-time alerts
- Configure notification methods per contact (SMS/Email/Call)
- Primary contact gets priority alerts

### 8. Secret Evidence Recording
- Automatically starts webcam + audio recording on SOS trigger
- Manual video/audio recording in Evidence tab
- Uploads encrypted to Cloudinary
- Linked to emergency logs with timestamps and location

### 9. Real-Time Guardian Dashboard
- Socket.IO powered live updates
- Shows emergency alerts with location and type
- Live tracking table with coordinates and timestamps
- Connection status indicator

### 10. Emergency Dashboard
- Panic button with countdown and ripple animation
- Feature toggles for voice/webcam/location/keyboard
- Tabbed interface: Overview, Monitoring, Safe Routes, Evidence, History, Contacts
- Glassmorphism UI with Framer Motion animations

## Security Implementation

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT access (7d) + refresh (30d) tokens |
| Passwords | Bcrypt with salt rounds 12 |
| Headers | Helmet.js with CSP, HSTS, X-Frame-Options |
| Rate Limiting | 100 req/15min general, 10 req/1min emergency |
| Encryption | AES-256-GCM for evidence URLs and sensitive data |
| CORS | Restricted to configured CLIENT_URL |
| Uploads | Multer with size limits, Cloudinary secure URLs |
| Validation | Joi schema validation on critical endpoints |

## Environment Variables Reference

### Backend `.env`

| Variable | Required | Source |
|----------|----------|--------|
| `PORT` | No | `5000` |
| `MONGODB_URI` | Yes | MongoDB Atlas or local |
| `JWT_SECRET` | Yes | Generate strong random string |
| `JWT_REFRESH_SECRET` | Yes | Generate strong random string |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary Dashboard |
| `GOOGLE_MAPS_API_KEY` | Yes | Google Cloud Console |
| `ENCRYPTION_KEY` | Yes | 32+ character random string |
| `SMTP_HOST` | No | Gmail, SendGrid, etc. |
| `SMTP_USER` | No | Your email |
| `SMTP_PASS` | No | App password |
| `TWILIO_ACCOUNT_SID` | No | Twilio Console |
| `TWILIO_AUTH_TOKEN` | No | Twilio Console |
| `TWILIO_PHONE_NUMBER` | No | Twilio purchased number |

### Frontend `.env.local`

| Variable | Required | Default |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:5000` |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | `http://localhost:5000` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | — |

## Obtaining API Keys

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable APIs: **Maps JavaScript API**, **Directions API**, **Places API**
4. Go to Credentials → Create API Key
5. Restrict key for HTTP referrers (`localhost:3000`, your production domain)
6. Paste key into both backend `.env` and frontend `.env.local`

### Cloudinary
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard → copy `Cloud name`, `API Key`, `API Secret`
3. Paste into backend `.env`

### Twilio (Optional)
1. Sign up at [Twilio](https://twilio.com)
2. Get Account SID and Auth Token from Console Dashboard
3. Buy a phone number
4. Paste into backend `.env`

### MongoDB Atlas
1. Create cluster at [MongoDB Atlas](https://mongodb.com/atlas)
2. Database Access → Create Database User
3. Network Access → Allow current IP / Allow all (`0.0.0.0/0`)
4. Clusters → Connect → Drivers → Node.js → copy connection string
5. Replace `<password>` with your database user password

## Troubleshooting

### `MongoServerError: bad auth` / connection refused
- Verify `MONGODB_URI` has correct password
- Check Network Access in Atlas allows your IP
- For local MongoDB, ensure `mongod` is running

### `face-api.js models not loading`
- Models load from CDN (`justadudewhohacks.github.io`)
- Requires internet connection on first load
- App falls back to simulation mode if models fail

### `Google Maps not showing`
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Ensure Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for API key errors

### `CORS error on API calls`
- Verify `CLIENT_URL` in backend `.env` matches your frontend URL exactly
- For development, use `http://localhost:3000`

### Socket.IO not connecting
- Ensure backend is running on the port configured in `NEXT_PUBLIC_SOCKET_URL`
- Check firewall isn't blocking WebSocket connections

## Production Deployment Checklist

- [ ] Change all default/JWT secrets to cryptographically strong random strings
- [ ] Use MongoDB Atlas with IP whitelist instead of `0.0.0.0/0`
- [ ] Enable Cloudinary upload presets and restrict file types
- [ ] Configure Helmet.js CSP for your production domain
- [ ] Set up PM2 or systemd for Node.js process management
- [ ] Use HTTPS with valid SSL certificate
- [ ] Enable Google Maps API key HTTP referrer restrictions
- [ ] Set `NODE_ENV=production`
- [ ] Configure Winston logs rotation
- [ ] Set up monitoring (e.g., UptimeRobot, New Relic)

## License

MIT
