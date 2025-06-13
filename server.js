import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import csrf from 'csrf';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import helmet from 'helmet';
import crypto from 'crypto';
// Redis imports removed - using memory-based sessions for simplicity

// Import security logging system
import {
  securityLogger,
  appLogger,
  SecurityEventTypes,
  SecuritySeverity,
  logSecurityEvent,
  logAuthEvent,
  logAuthzEvent,
  logRateLimitEvent,
  logIPBlockingEvent,
  logSessionEvent,
  requestLoggingMiddleware,
  errorLoggingMiddleware
} from './lib/security-logger.js';

// Load environment variables from .env
dotenv.config({ path: '.env' });

// Supabase configuration
const SUPABASE_URL = 'https://jsilzrsiieswiskzcriy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  process.exit(1);
}

console.log('🔧 Using Supabase URL:', SUPABASE_URL);
console.log('🔑 Service role key loaded:', SUPABASE_SERVICE_KEY ? 'Yes' : 'No');

// Use service role key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const app = express();
const PORT = 3001;
const HTTPS_PORT = 3443;

// Security middleware - Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// CORS configuration with security headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your actual domain
    : ['http://localhost:5173', 'https://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests, // Don't count successful requests
    handler: (req, res) => {
      console.log(`🚫 Rate limit exceeded for IP ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Too many requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// General rate limiter - 100 requests per 15 minutes
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // max 100 requests per windowMs
  'Too many requests from this IP, please try again in 15 minutes.'
);

// Strict rate limiter for sensitive endpoints - 10 requests per 15 minutes
const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // max 10 requests per windowMs
  'Too many requests to sensitive endpoint, please try again in 15 minutes.'
);

// API rate limiter - 50 requests per 10 minutes
const apiLimiter = createRateLimiter(
  10 * 60 * 1000, // 10 minutes
  50, // max 50 requests per windowMs
  'Too many API requests, please try again in 10 minutes.',
  true // Don't count successful requests
);

// Webhook rate limiter - 20 requests per 5 minutes
const webhookLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  20, // max 20 requests per windowMs
  'Too many webhook requests, please try again in 5 minutes.'
);

// IP blocking system
const blockedIPs = new Set();
const suspiciousIPs = new Map(); // IP -> { attempts: number, lastAttempt: timestamp }

// IP blocking middleware
const ipBlockingMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    console.log(`🚫 Blocked IP ${clientIP} attempted to access ${req.path}`);
    
    // Log IP blocking event
    logIPBlockingEvent('blocked_access_attempt', clientIP, {
      ip: clientIP,
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'Your IP address has been blocked due to suspicious activity',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Enhanced rate limiting with IP tracking
const enhancedRateLimitHandler = (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Track suspicious activity
  if (!suspiciousIPs.has(clientIP)) {
    suspiciousIPs.set(clientIP, { attempts: 1, lastAttempt: Date.now() });
  } else {
    const info = suspiciousIPs.get(clientIP);
    info.attempts += 1;
    info.lastAttempt = Date.now();
    
    // Block IP if too many rate limit violations (5 violations in 1 hour)
    if (info.attempts >= 5) {
      blockedIPs.add(clientIP);
      console.log(`🔒 IP ${clientIP} has been blocked after ${info.attempts} rate limit violations`);
      
      // Log IP blocking event
      logIPBlockingEvent('ip_blocked', clientIP, {
        ip: clientIP,
        reason: 'rate_limit_violations',
        violations: info.attempts,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      // Auto-unblock after 24 hours
      setTimeout(() => {
        blockedIPs.delete(clientIP);
        suspiciousIPs.delete(clientIP);
        console.log(`🔓 IP ${clientIP} has been automatically unblocked after 24 hours`);
        
        // Log IP unblocking event
        logIPBlockingEvent('ip_unblocked', clientIP, {
          ip: clientIP,
          reason: 'auto_unblock_24h',
          timestamp: new Date().toISOString()
        });
      }, 24 * 60 * 60 * 1000); // 24 hours
    }
  }
  
  // Log rate limit event
  logRateLimitEvent(true, {
    ip: clientIP,
    endpoint: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    violations: suspiciousIPs.get(clientIP)?.attempts || 1,
    timestamp: new Date().toISOString()
  });
  
  console.log(`🚫 Rate limit exceeded for IP ${clientIP} on ${req.path} (${suspiciousIPs.get(clientIP)?.attempts || 1} violations)`);
  res.status(429).json({
    error: 'Too many requests',
    message: 'Rate limit exceeded. Repeated violations may result in IP blocking.',
    retryAfter: 900, // 15 minutes
    timestamp: new Date().toISOString(),
    violations: suspiciousIPs.get(clientIP)?.attempts || 1
  });
};

// Update rate limiters to use enhanced handler
const createEnhancedRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: enhancedRateLimitHandler
  });
};

// Apply IP blocking middleware first
app.use(ipBlockingMiddleware);

// Apply request logging middleware
app.use(requestLoggingMiddleware);

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Comprehensive security headers with Helmet (includes CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // For inline scripts (use nonce in production)
        "'unsafe-eval'", // For development (remove in production)
        "https://cdn.jsdelivr.net", // For CDN scripts
        "https://unpkg.com", // For unpkg CDN
        "https://cdnjs.cloudflare.com" // For cloudflare CDN
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // For inline styles
        "https://fonts.googleapis.com", // Google Fonts
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com", // Google Fonts
        "data:" // For data URLs
      ],
      imgSrc: [
        "'self'",
        "data:", // For data URLs (base64 images)
        "https:", // Allow HTTPS images
        "blob:" // For blob URLs
      ],
      connectSrc: [
        "'self'",
        "https://api.openai.com", // OpenAI API
        "https://api.anthropic.com", // Anthropic API
        "https://*.supabase.co", // Supabase
        "wss://*.supabase.co", // Supabase WebSocket
        "https://localhost:*", // Local development
        "ws://localhost:*", // Local WebSocket
        "wss://localhost:*" // Local WebSocket SSL
      ],
      frameSrc: ["'none'"], // Completely disallow frames
      objectSrc: ["'none'"], // Disallow object, embed, applet
      mediaSrc: ["'self'", "blob:", "data:"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'"],
      formAction: ["'self'"], // Only allow forms to submit to same origin
      upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
    },
    reportOnly: process.env.NODE_ENV === 'development' // Report-only mode in development
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // X-Frame-Options: DENY
  },
  noSniff: true, // X-Content-Type-Options: nosniff
  xssFilter: true, // X-XSS-Protection: 1; mode=block
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  permittedCrossDomainPolicies: false, // X-Permitted-Cross-Domain-Policies: none
  dnsPrefetchControl: {
    allow: false // X-DNS-Prefetch-Control: off
  }
}));

app.use(express.json());
app.use(cookieParser());

console.log('📝 Using memory-based session storage');

// Enhanced session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  },
  name: 'psyrehab.sid', // Custom session name
  genid: () => {
    // Generate cryptographically secure session IDs
    return crypto.randomBytes(32).toString('hex');
  }
}));

// Session security middleware
app.use((req, res, next) => {
  // Regenerate session ID on login/privilege escalation (placeholder for auth)
  if (req.session && req.session.regenerateOnNextRequest) {
    req.session.regenerateOnNextRequest = false;
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
      }
      next();
    });
  } else {
    next();
  }
});

// Session monitoring and cleanup
app.use((req, res, next) => {
  if (req.session) {
    // Track session activity
    req.session.lastActivity = new Date().toISOString();
    
    // Track IP changes (basic session hijacking detection)
    const currentIP = req.ip || req.connection.remoteAddress;
    if (req.session.ipAddress && req.session.ipAddress !== currentIP) {
      console.log(`⚠️  Session IP change detected: ${req.session.ipAddress} -> ${currentIP}`);
      
      // Log potential session hijacking attempt
      logSecurityEvent(SecurityEventTypes.SESSION, SecuritySeverity.HIGH, 
        'Session IP address change detected - potential hijacking attempt', {
          ip: currentIP,
          originalIP: req.session.ipAddress,
          sessionId: req.sessionID,
          userAgent: req.headers['user-agent'],
          endpoint: req.path,
          method: req.method
        });
      
      // In production, you might want to invalidate the session here
      req.session.ipChangeDetected = true;
    }
    req.session.ipAddress = currentIP;
    
    // Track user agent changes
    const currentUA = req.headers['user-agent'];
    if (req.session.userAgent && req.session.userAgent !== currentUA) {
      console.log('⚠️  Session User-Agent change detected');
      
      // Log potential session hijacking attempt
      logSecurityEvent(SecurityEventTypes.SESSION, SecuritySeverity.MEDIUM, 
        'Session User-Agent change detected - potential hijacking attempt', {
          ip: currentIP,
          sessionId: req.sessionID,
          originalUserAgent: req.session.userAgent,
          newUserAgent: currentUA,
          endpoint: req.path,
          method: req.method
        });
      
      req.session.uaChangeDetected = true;
    }
    req.session.userAgent = currentUA;
  }
  next();
});

// CSRF protection setup
const csrfProtection = csrf();

// CSRF token generation endpoint
app.get('/api/csrf-token', (req, res) => {
  const secret = req.session.csrfSecret || csrfProtection.secretSync();
  req.session.csrfSecret = secret;
  
  const token = csrfProtection.create(secret);
  
  res.json({
    csrfToken: token,
    timestamp: new Date().toISOString()
  });
});

// Session management endpoints
app.get('/api/session/info', (req, res) => {
  if (!req.session) {
    logSessionEvent('session_info_failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      reason: 'session_not_available'
    });
    
    return res.status(500).json({
      error: 'Session not available',
      timestamp: new Date().toISOString()
    });
  }

  logSessionEvent('session_info_accessed', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    sessionId: req.sessionID
  });

  res.json({
    sessionId: req.sessionID,
    lastActivity: req.session.lastActivity,
    ipAddress: req.session.ipAddress,
    userAgent: req.session.userAgent,
    ipChangeDetected: req.session.ipChangeDetected || false,
    uaChangeDetected: req.session.uaChangeDetected || false,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/session/regenerate', (req, res) => {
  if (!req.session) {
    logSessionEvent('session_regenerate_failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      reason: 'session_not_available'
    });
    
    return res.status(500).json({
      error: 'Session not available',
      timestamp: new Date().toISOString()
    });
  }

  const oldSessionId = req.sessionID;
  
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regeneration error:', err);
      
      logSessionEvent('session_regenerate_failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: oldSessionId,
        error: err.message
      });
      
      return res.status(500).json({
        error: 'Failed to regenerate session',
        timestamp: new Date().toISOString()
      });
    }

    logSessionEvent('session_regenerated', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      oldSessionId,
      newSessionId: req.sessionID
    });

    res.json({
      success: true,
      message: 'Session regenerated successfully',
      newSessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });
  });
});

app.post('/api/session/destroy', (req, res) => {
  if (!req.session) {
    logSessionEvent('session_destroy_failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      reason: 'session_not_available'
    });
    
    return res.status(500).json({
      error: 'Session not available',
      timestamp: new Date().toISOString()
    });
  }

  const sessionId = req.sessionID;
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      
      logSessionEvent('session_destroy_failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId,
        error: err.message
      });
      
      return res.status(500).json({
        error: 'Failed to destroy session',
        timestamp: new Date().toISOString()
      });
    }

    logSessionEvent('session_destroyed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId
    });

    res.clearCookie('psyrehab.sid');
    res.json({
      success: true,
      message: 'Session destroyed successfully',
      timestamp: new Date().toISOString()
    });
  });
});

// CSRF validation middleware
const validateCSRF = (req, res, next) => {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for webhook endpoints (they use other authentication)
  if (req.path.startsWith('/api/webhook/')) {
    return next();
  }
  
  // Skip CSRF for AI recommendation endpoint (temporary for development)
  if (req.path === '/api/ai/recommend' || req.path === '/ai/recommend') {
    return next();
  }
  
  const secret = req.session.csrfSecret;
  if (!secret) {
    // Log CSRF validation failure
    logSecurityEvent(SecurityEventTypes.CSRF, SecuritySeverity.MEDIUM, 
      'CSRF validation failed - no secret found', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.sessionID,
        endpoint: req.path,
        method: req.method
      });
    
    return res.status(403).json({
      error: 'CSRF validation failed',
      message: 'No CSRF secret found. Please get a CSRF token first.',
      timestamp: new Date().toISOString()
    });
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;
  if (!token) {
    // Log CSRF validation failure
    logSecurityEvent(SecurityEventTypes.CSRF, SecuritySeverity.MEDIUM, 
      'CSRF validation failed - no token provided', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.sessionID,
        endpoint: req.path,
        method: req.method
      });
    
    return res.status(403).json({
      error: 'CSRF validation failed',
      message: 'No CSRF token provided. Include X-CSRF-Token header or _csrf in body/query.',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    if (!csrfProtection.verify(secret, token)) {
      // Log CSRF validation failure
      logSecurityEvent(SecurityEventTypes.CSRF, SecuritySeverity.HIGH, 
        'CSRF validation failed - invalid token', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          sessionId: req.sessionID,
          endpoint: req.path,
          method: req.method,
          providedToken: token.substring(0, 10) + '...' // Log partial token for debugging
        });
      
      return res.status(403).json({
        error: 'CSRF validation failed',
        message: 'Invalid CSRF token.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Log successful CSRF validation
    logSecurityEvent(SecurityEventTypes.CSRF, SecuritySeverity.LOW, 
      'CSRF validation successful', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.sessionID,
        endpoint: req.path,
        method: req.method
      });
    
    next();
  } catch (error) {
    console.error('CSRF validation error:', error);
    
    // Log CSRF validation error
    logSecurityEvent(SecurityEventTypes.CSRF, SecuritySeverity.HIGH, 
      'CSRF validation error - exception occurred', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.sessionID,
        endpoint: req.path,
        method: req.method,
        error: error.message
      });
    
    res.status(403).json({
      error: 'CSRF validation failed',
      message: 'CSRF token validation error.',
      timestamp: new Date().toISOString()
    });
  }
};

// Apply CSRF validation to state-changing requests
app.use('/api', (req, res, next) => {
  // Apply CSRF validation for all API routes except GET, HEAD, OPTIONS and webhooks
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && 
      !req.path.startsWith('/webhook/') && 
      req.path !== '/ai/recommend') {  // Skip CSRF for AI recommend endpoint
    return validateCSRF(req, res, next);
  }
  next();
});

// Test logging endpoint
app.get('/api/test/logging', (req, res) => {
  console.log('🧪 Testing logging system...');
  
  // Test all types of security logging
  logSecurityEvent(SecurityEventTypes.AUTHENTICATION, SecuritySeverity.LOW, 
    'Test authentication event', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      endpoint: req.path,
      method: req.method,
      testEvent: true
    });
    
  logAuthEvent('test_login', true, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    username: 'test_user'
  });
  
  logAuthzEvent('test_access', true, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    resource: 'test_resource'
  });
  
  logRateLimitEvent(false, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    endpoint: req.path
  });
  
  logSessionEvent('test_session_activity', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    sessionId: req.sessionID
  });
  
  appLogger.info('Test app log message', {
    testEvent: true,
    ip: req.ip,
    endpoint: req.path
  });
  
  console.log('✅ All logging functions called');
  
  res.json({
    success: true,
    message: 'Logging test completed',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test Supabase connection and get sample patient
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        supabase: 'error',
        supabaseError: error.message
      });
    } else {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        supabase: 'connected',
        samplePatient: data && data.length > 0 ? data[0] : null,
        patientsCount: data ? data.length : 0
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      supabase: 'connection_failed',
      error: error.message
    });
  }
});

// N8N webhook endpoint with stricter rate limiting
app.post('/api/webhook/n8n', webhookLimiter, async (req, res) => {
  try {
    console.log('=== N8N Webhook Received ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('===============================');

    const data = req.body;
    
    // Validate required fields
    if (!data.patientId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: patientId'
      });
    }

    // Check if this is assessment data (input to N8N) or AI recommendation result (output from N8N)
    if (data.assessmentData) {
      // This is assessment data being sent TO N8N - just log and acknowledge
      console.log('📤 Assessment data sent to N8N for processing');
      console.log(`Patient ID: ${data.patientId}`);
      console.log(`Assessment details:`, data.assessmentData);
      
      res.json({
        success: true,
        message: 'Assessment data received for AI processing',
        timestamp: new Date().toISOString(),
        patientId: data.patientId
      });
    } else if (data.recommendations || data.plans || data.결과) {
      // This is AI recommendation result FROM N8N - save to database
      console.log('📥 AI recommendation result received from N8N');
      
      try {
        // Find patient by identifier if it's not a UUID
        let patientUuid = data.patientId;
        
        // Check if patientId is a UUID or a string identifier
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(data.patientId)) {
          // It's a string identifier, find the patient UUID
          const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('id')
            .eq('patient_identifier', data.patientId)
            .single();
            
          if (patientError || !patient) {
            // Create a test patient if not found
            const { data: newPatient, error: createError } = await supabase
              .from('patients')
              .insert({
                patient_identifier: data.patientId,
                full_name: data.assessmentData?.patient_info?.name || 'Test Patient',
                date_of_birth: '1990-01-01',
                gender: data.assessmentData?.patient_info?.gender || 'unknown',
                contact_info: {},
                admission_date: new Date().toISOString().split('T')[0],
                status: 'active',
                additional_info: data.assessmentData || {}
              })
              .select('id')
              .single();
              
            if (createError) {
              console.error('❌ Error creating test patient:', createError);
              throw createError;
            }
            patientUuid = newPatient.id;
            console.log('✅ Created test patient:', patientUuid);
          } else {
            patientUuid = patient.id;
            console.log('✅ Found existing patient:', patientUuid);
          }
        }

        // Save AI recommendation to database
        const { data: savedRecommendation, error: saveError } = await supabase
          .from('ai_goal_recommendations')
          .insert({
            patient_id: patientUuid,
            assessment_id: data.assessmentId || null,
            assessment_data: data.assessmentData || {},
            recommendation_date: new Date().toISOString(),
            patient_analysis: data.patientAnalysis || {},
            six_month_goals: data.recommendations || data.plans || data.결과 || {},
            monthly_plans: data.monthlyPlans || {},
            weekly_plans: data.weeklyPlans || {},
            execution_strategy: data.executionStrategy || {},
            success_indicators: data.successIndicators || {},
            is_active: true
          })
          .select()
          .single();

        if (saveError) {
          console.error('❌ Error saving AI recommendation:', saveError);
          throw saveError;
        }

        console.log('✅ AI recommendation saved successfully:', savedRecommendation.id);

        res.json({
          success: true,
          message: 'AI recommendation saved successfully',
          timestamp: new Date().toISOString(),
          recommendationId: savedRecommendation.id,
          patientId: data.patientId
        });
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        res.status(500).json({
          success: false,
          error: 'Failed to save AI recommendation',
          details: dbError.message
        });
      }
    } else {
      // Unknown data format - just acknowledge
      console.log('📝 Unknown webhook data format - logging only');
      res.json({
        success: true,
        message: 'Webhook data received',
        timestamp: new Date().toISOString(),
        data: req.body
      });
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// AI 추천 결과 조회 API (DB에서 직접)
app.get('/api/patients/:id/ai-response', apiLimiter, async (req, res) => {
  try {
    const patientId = req.params.id;
    console.log(`[ai-response] Patient ${patientId} AI 추천 조회 요청`);
    
    // 환자 ID를 UUID로 변환 (필요한 경우)
    let patientUuid = patientId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(patientId)) {
      // String identifier인 경우 UUID 조회
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('patient_identifier', patientId)
        .single();
        
      if (patientError || !patient) {
        console.log(`[ai-response] ❌ 환자를 찾을 수 없음: ${patientId}`);
        return res.json(null);
      }
      patientUuid = patient.id;
    }

    // 최신 AI 추천 조회
    const { data: aiRecommendation, error } = await supabase
      .from('ai_goal_recommendations')
      .select('*')
      .eq('patient_id', patientUuid)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error(`[ai-response] DB 에러:`, error);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!aiRecommendation) {
      console.log(`[ai-response] ❌ AI 추천 없음 (Patient: ${patientUuid})`);
      return res.json(null);
    }

    // 응답 데이터 포맷팅 (React 앱에서 예상하는 형식으로)
    const responseData = {
      goals: aiRecommendation.six_month_goals || [],
      patientAnalysis: aiRecommendation.patient_analysis || {},
      monthlyPlans: aiRecommendation.monthly_plans || {},
      weeklyPlans: aiRecommendation.weekly_plans || {},
      executionStrategy: aiRecommendation.execution_strategy || {},
      successIndicators: aiRecommendation.success_indicators || {},
      timestamp: aiRecommendation.created_at,
      recommendationId: aiRecommendation.id
    };

    console.log(`[ai-response] ✅ AI 추천 반환 (goals: ${responseData.goals?.length || 0}개)`);
    res.json(responseData);

  } catch (error) {
    console.error(`[ai-response] 에러:`, error);
    res.status(500).json({ message: 'Error fetching AI response' });
  }
});

// AI recommendation request endpoint
app.post('/api/ai/recommend', apiLimiter, async (req, res) => {
  try {
    console.log('[AI] AI 추천 요청 받음:', req.body);
    const { assessmentId } = req.body;

    if (!assessmentId) {
      return res.status(400).json({ error: 'Assessment ID is required' });
    }

    // 평가 데이터 조회 (환자 정보 포함)
    const { data: assessment, error: fetchError } = await supabase
      .from('assessments')
      .select(`
        *,
        patient:patients!inner(
          id,
          full_name,
          date_of_birth,
          gender,
          additional_info
        )
      `)
      .eq('id', assessmentId)
      .single();

    if (fetchError || !assessment) {
      console.error('[AI] Assessment fetch error:', fetchError);
      return res.status(404).json({ 
        error: 'Assessment not found', 
        details: fetchError?.message 
      });
    }

    // 나이 계산 함수
    const calculateAge = (birthDate) => {
      if (!birthDate) return null;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    // 이환기간 계산 (진단일로부터)
    const calculateDiseaseDuration = (diagnosisDate) => {
      if (!diagnosisDate) return null;
      const today = new Date();
      const diagnosis = new Date(diagnosisDate);
      return Math.floor((today - diagnosis) / (365.25 * 24 * 60 * 60 * 1000));
    };

    // 환자 정보 추출
    const patientInfo = assessment.patient;
    const diagnosis = patientInfo.additional_info?.diagnosis || null;
    const diagnosisDate = patientInfo.additional_info?.diagnosis_date || null;
    const age = calculateAge(patientInfo.date_of_birth);
    const diseaseDurationYears = calculateDiseaseDuration(diagnosisDate);

    // 평가 데이터를 AI 분석용으로 변환
    const aiPayload = {
      assessmentId: assessment.id,
      patientId: assessment.patient_id,
      patientInfo: {
        age: age,
        gender: patientInfo.gender || null,
        diagnosis: diagnosis
      },
      assessmentData: {
        focusTime: assessment.focus_time,
        motivationLevel: assessment.motivation_level,
        pastSuccesses: assessment.past_successes || [],
        constraints: assessment.constraints || [],
        socialPreference: assessment.social_preference
      },
      timestamp: new Date().toISOString()
    };

    // n8n 웹훅 URL
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://baclava.uk/webhook/09b18ab5-1bdb-4e04-88e4-63babb1f4b46';

    try {
      // n8n 웹훅으로 데이터 전송
      console.log('[AI] n8n 웹훅으로 전송:', N8N_WEBHOOK_URL);
      console.log('[AI] 전송 데이터:', JSON.stringify(aiPayload, null, 2));
      
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiPayload)
      });

      if (!n8nResponse.ok) {
        throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
      }

      const n8nResult = await n8nResponse.json();
      console.log('[AI] n8n 응답:', n8nResult);

      return res.json({
        success: true,
        message: 'Assessment data sent to AI processing successfully',
        data: {
          assessmentId: assessmentId,
          patientId: assessment.patient_id,
          status: 'processing',
          n8nResponse: n8nResult
        }
      });

    } catch (n8nError) {
      console.error('[AI] N8N webhook error:', n8nError);
      return res.status(500).json({ 
        error: 'Failed to send data to AI processing', 
        details: n8nError instanceof Error ? n8nError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('[AI] API processing error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Legacy endpoint (without /api prefix) - redirects to new endpoint
app.post('/ai/recommend', apiLimiter, async (req, res) => {
  console.log('[AI] Legacy endpoint called, redirecting to /api/ai/recommend');
  req.url = '/api/ai/recommend';
  return app._router.handle(req, res);
});

// AI recommendation status endpoint with API rate limiting
app.get('/api/ai/recommendation/status/:assessmentId', apiLimiter, (req, res) => {
  const { assessmentId } = req.params;
  
  // This would normally check database
  res.json({
    assessmentId,
    status: 'completed',
    timestamp: new Date().toISOString()
  });
});

// Admin endpoints for IP management (should be protected with authentication in production)
app.get('/api/admin/blocked-ips', strictLimiter, (req, res) => {
  // Log admin access
  logAuthzEvent('admin_blocked_ips_access', true, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    sessionId: req.sessionID,
    endpoint: req.path,
    method: req.method
  });
  
  res.json({
    blockedIPs: Array.from(blockedIPs),
    suspiciousIPs: Object.fromEntries(suspiciousIPs),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/admin/unblock-ip/:ip', strictLimiter, (req, res) => {
  const { ip } = req.params;
  
  if (blockedIPs.has(ip)) {
    blockedIPs.delete(ip);
    suspiciousIPs.delete(ip);
    console.log(`🔓 IP ${ip} manually unblocked by admin`);
    
    // Log IP unblocking by admin
    logIPBlockingEvent('ip_manually_unblocked', ip, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.sessionID,
      adminAction: true,
      targetIP: ip
    });
    
    res.json({
      success: true,
      message: `IP ${ip} has been unblocked`,
      timestamp: new Date().toISOString()
    });
  } else {
    // Log failed unblock attempt
    logIPBlockingEvent('ip_unblock_failed', ip, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.sessionID,
      adminAction: true,
      targetIP: ip,
      reason: 'ip_not_blocked'
    });
    
    res.status(404).json({
      success: false,
      message: `IP ${ip} is not currently blocked`,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/admin/block-ip/:ip', strictLimiter, (req, res) => {
  const { ip } = req.params;
  
  blockedIPs.add(ip);
  console.log(`🔒 IP ${ip} manually blocked by admin`);
  
  // Log IP blocking by admin
  logIPBlockingEvent('ip_manually_blocked', ip, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    sessionId: req.sessionID,
    adminAction: true,
    targetIP: ip
  });
  
  res.json({
    success: true,
    message: `IP ${ip} has been blocked`,
    timestamp: new Date().toISOString()
  });
});

// Add error logging middleware (should be last)
app.use(errorLoggingMiddleware);

// SSL certificate configuration for development
const getSSLOptions = () => {
  const certPath = process.env.EXPRESS_SSL_CERT;
  const keyPath = process.env.EXPRESS_SSL_KEY;
  
  if (certPath && keyPath && existsSync(certPath) && existsSync(keyPath)) {
    try {
      return {
        cert: readFileSync(certPath),
        key: readFileSync(keyPath)
      };
    } catch (error) {
      console.warn('⚠️  Failed to read SSL certificates:', error.message);
      return null;
    }
  }
  return null;
};

// Start servers
const sslOptions = getSSLOptions();

// Always start HTTP server
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log(`🚀 HTTP server running on http://localhost:${PORT}`);
  console.log(`📝 N8N Webhook URL: http://localhost:${PORT}/api/webhook/n8n`);
});

// Start HTTPS server if SSL certificates are available
if (sslOptions) {
  const httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`🔒 HTTPS server running on https://localhost:${HTTPS_PORT}`);
    console.log(`📝 Secure N8N Webhook URL: https://localhost:${HTTPS_PORT}/api/webhook/n8n`);
  });
} else {
  console.log('⚠️  No SSL certificates found. HTTPS server not started.');
  console.log('💡 Run "npm run setup-ssl" to generate development certificates.');
} 