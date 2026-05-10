# 🚀 SafeHer - AI Powered Women Safety Platform

## 📋 Complete Installation Guide

### 🏗️ Project Overview

SafeHer is a production-ready, AI-powered women safety platform that provides real-time emergency detection and response through:
- **Voice Distress Detection** - AI-powered speech analysis
- **Emotion Recognition** - Webcam-based fear detection
- **Live Location Tracking** - Real-time GPS monitoring
- **Emergency SOS System** - Instant alerts to guardians
- **Evidence Recording** - Secure cloud storage
- **Safe Route Navigation** - AI-powered route planning

---

## 🛠️ Prerequisites

### System Requirements
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **MongoDB** >= 5.0
- **Git** for version control

### API Keys Required
1. **Google Maps API** - For location services
2. **Cloudinary API** - For media storage
3. **Twilio API** - For SMS notifications
4. **Gmail App Password** - For email alerts

---

## 📦 Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "safe her _ Complete"
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Environment Configuration

#### Backend Environment (.env)
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safeher?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# Admin
ADMIN_EMAIL=admin@safeher.app
```

#### Frontend Environment (.env.local)
```bash
cd ../frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## 🔑 API Setup Instructions

### 1. Google Maps API
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Directions API
4. Create API key with restrictions
5. Add key to both backend and frontend .env files

### 2. Cloudinary Setup
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret
3. Add to backend .env file

### 3. Twilio SMS Setup
1. Create account at [Twilio](https://www.twilio.com/)
2. Get Account SID, Auth Token, and Phone Number
3. Add to backend .env file

### 4. Gmail Setup
1. Enable 2-factor authentication on your Gmail
2. Generate App Password
3. Add SMTP credentials to backend .env file

---

## 🚀 Running the Application

### 1. Start MongoDB
```bash
# If using local MongoDB
mongod

# If using MongoDB Atlas, ensure your IP is whitelisted
```

### 2. Start Backend Server
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

### 3. Start Frontend Application
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

---

## 🧪 Testing the Application

### 1. Create Account
- Visit `http://localhost:3000`
- Click "Get Started Free"
- Fill registration form
- Verify email (if configured)

### 2. Test Features
- **Voice Detection**: Enable microphone and say distress words
- **Emotion Detection**: Enable webcam for face monitoring
- **SOS Button**: Test emergency activation
- **Live Tracking**: Check location updates
- **Guardian Dashboard**: Add emergency contacts

---

## 🐳 Docker Deployment (Optional)

### Build Docker Images
```bash
# Backend
cd backend
docker build -t safeher-backend .

# Frontend
cd frontend
docker build -t safeher-frontend .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

---

## 🌐 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com
```

### Security Checklist
- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Backup database regularly
- [ ] Rate limiting configured
- [ ] CORS properly configured

---

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
# Check MongoDB URI format
# Ensure IP is whitelisted (for Atlas)
# Verify network connectivity
```

#### 2. Face API Models Not Loading
```bash
# Check internet connection
# Verify browser supports WebRTC
# Check camera permissions
```

#### 3. Voice Recognition Not Working
```bash
# Check microphone permissions
# Verify HTTPS (required for voice APIs)
# Check browser compatibility
```

#### 4. API Keys Not Working
```bash
# Verify API key format
# Check API key restrictions
# Ensure billing is enabled
# Verify API quotas
```

### Debug Mode
```bash
# Backend debug mode
DEBUG=* npm run dev

# Frontend debug mode
NEXT_PUBLIC_DEBUG=true npm run dev
```

---

## 📱 Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required Permissions
- 🎤 Microphone access
- 📷 Camera access
- 📍 Location access
- 🔔 Notifications

---

## 🛡️ Security Features

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Session management
- Rate limiting

### Data Protection
- Encrypted data storage
- Secure API endpoints
- CORS protection
- Helmet.js security headers

### Privacy
- Local data processing
- No data sharing with third parties
- User consent required
- GDPR compliant

---

## 📞 Support

### Documentation
- API Documentation: `/api/docs`
- Health Check: `/api/health`

### Emergency Contacts
- Technical Support: admin@safeher.app
- Emergency: Local emergency services

---

## 🔄 Updates and Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Security patches
npm audit fix
```

### Database Maintenance
```bash
# Backup database
mongodump --uri="your_mongodb_uri" --out=backup/

# Restore database
mongorestore --uri="your_mongodb_uri" backup/
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎉 You're Ready!

SafeHer is now fully configured and ready to protect users with AI-powered safety features.

**Next Steps:**
1. Test all features thoroughly
2. Configure production environment
3. Set up monitoring
4. Deploy to production
5. Train users on safety features

Stay Safe with SafeHer! 🛡️
