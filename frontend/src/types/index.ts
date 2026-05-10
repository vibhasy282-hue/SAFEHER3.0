export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'guardian' | 'admin';
  avatar?: string;
  settings?: UserSettings;
  lastLocation?: LocationData;
  isOnline?: boolean;
}

export interface UserSettings {
  autoSOS: boolean;
  voiceDetection: boolean;
  webcamMonitoring: boolean;
  gestureDetection: boolean;
  keyboardSOS: boolean;
  backgroundMonitoring: boolean;
  shareLocation: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  placeName?: string;
  timestamp?: string;
}

export interface Contact {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isGuardian: boolean;
  isPrimary: boolean;
  notifyMethods: {
    sms: boolean;
    email: boolean;
    call: boolean;
  };
}

export interface EmergencyLog {
  _id: string;
  type: string;
  severity: string;
  status: string;
  location: LocationData;
  triggeredBy: string;
  aiConfidence: number;
  evidence: Evidence[];
  alertsSent: Alert[];
  createdAt: string;
  resolvedAt?: string;
}

export interface Evidence {
  type: 'video' | 'audio' | 'image' | 'text';
  url: string;
  timestamp: string;
}

export interface Alert {
  contact: Contact;
  method: string;
  status: string;
  timestamp: string;
}

export interface Recording {
  _id: string;
  type: string;
  originalUrl: string;
  duration: number;
  location?: LocationData;
  isEvidence: boolean;
  createdAt: string;
}

export interface AIAnalysisResult {
  isEmergency: boolean;
  confidence: number;
  recommendation: 'trigger_sos' | 'monitor';
  timestamp: string;
}

export interface SafeSpot {
  name: string;
  type: 'police' | 'hospital' | 'fire_station' | 'crowded_area' | 'shop' | 'other';
  distance: number;
  latitude: number;
  longitude: number;
}
