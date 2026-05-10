const EmergencyLog = require('../models/EmergencyLog');
const Location = require('../models/Location');
const logger = require('../utils/logger');
const { getIO } = require('../socket/socketHandler');

// AI analysis results endpoint
exports.analyzeVoice = async (req, res) => {
  try {
    const { transcript, confidence, keywords, emotion } = req.body;

    // AI voice analysis logic
    const isDistress = keywords?.some(k =>
      ['help', 'save me', 'emergency', 'danger', 'stop', 'please no', 'scream', 'help me'].includes(k.toLowerCase())
    );

    const threatLevel = isDistress ? 'high' : confidence > 0.7 ? 'medium' : 'low';

    res.json({
      success: true,
      analysis: {
        isDistress,
        threatLevel,
        confidence,
        keywords,
        emotion,
        recommendation: isDistress ? 'trigger_sos' : 'monitor'
      }
    });
  } catch (error) {
    logger.error('AI voice analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.analyzeEmotion = async (req, res) => {
  try {
    const { emotions, faceDetected, confidence } = req.body;

    const fearLevel = emotions?.fear || 0;
    const sadnessLevel = emotions?.sad || 0;
    const isFearDetected = fearLevel > 0.6 || sadnessLevel > 0.7;

    const threatLevel = isFearDetected ? 'high' : fearLevel > 0.4 ? 'medium' : 'low';

    res.json({
      success: true,
      analysis: {
        isFearDetected,
        threatLevel,
        confidence,
        emotions,
        recommendation: isFearDetected ? 'trigger_sos' : 'monitor'
      }
    });
  } catch (error) {
    logger.error('AI emotion analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.analyzeGesture = async (req, res) => {
  try {
    const { gesture, confidence, repetitions } = req.body;

    const isSOSGesture = gesture === 'open_palm_wave' && repetitions >= 3 && confidence > 0.7;

    res.json({
      success: true,
      analysis: {
        isSOSGesture,
        gesture,
        confidence,
        repetitions,
        recommendation: isSOSGesture ? 'trigger_sos' : 'monitor'
      }
    });
  } catch (error) {
    logger.error('AI gesture analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.processAIEvent = async (req, res) => {
  try {
    const { eventType, data, location } = req.body;
    const userId = req.user.id;

    // Create emergency log for AI-detected events
    if (['voice_distress', 'emotion_fear', 'gesture_sos'].includes(eventType)) {
      const emergencyLog = await EmergencyLog.create({
        user: userId,
        type: eventType,
        severity: data.confidence > 0.8 ? 'critical' : 'high',
        triggeredBy: eventType === 'voice_distress' ? 'ai_voice' : eventType === 'emotion_fear' ? 'ai_emotion' : 'ai_gesture',
        aiConfidence: data.confidence,
        location: {
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          timestamp: new Date()
        }
      });

      if (location) {
        await Location.create({
          user: userId,
          ...location,
          isEmergency: true
        });
      }

      // Notify user and guardians
      const io = getIO();
      io.to(`user_${userId}`).emit('ai_emergency_detected', {
        emergencyId: emergencyLog._id,
        type: eventType,
        confidence: data.confidence
      });

      return res.status(201).json({
        success: true,
        message: 'AI emergency event processed',
        emergencyId: emergencyLog._id
      });
    }

    res.json({ success: true, message: 'AI event logged' });
  } catch (error) {
    logger.error('Process AI event error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
