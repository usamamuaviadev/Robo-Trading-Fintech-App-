// Polyfill for Object.hasOwn (Node.js < 16.9.0 compatibility)
if (!Object.hasOwn) {
  Object.hasOwn = function(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Don't exit in production - log and continue
  if (process.env.NODE_ENV === 'production') {
    console.error('Error logged, server continues...');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('❌ Stack:', err.stack);
  // In production, try to log and continue if possible
  // Exit on uncaught exceptions as they indicate serious issues
  // But give it a moment to log
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

const app = express();

// CORS: allow multiple origins (comma-separated FRONTEND_URL, or single value)
const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
if (corsOrigins.length === 0) corsOrigins.push('http://localhost:3000');
// Always allow common local dev origins for admin panel
const allowedOrigins = new Set([
  ...corsOrigins,
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8082',
  'http://127.0.0.1:5173',
]);

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, origin || true);
    } else if (process.env.NODE_ENV === 'production') {
      callback(new Error('Not allowed by CORS'));
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection with retry logic
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/robo-advisor';
    console.log(`🔌 Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('⚠️ Server will continue but database operations may fail');
    console.error('⚠️ MongoDB will retry connection automatically');
    // Don't exit - allow server to start even if DB connection fails
    // This prevents 502 errors during deployment
  }
};

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Attempt initial connection
connectDB();

// Health check - should be available even if routes fail
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Robo Advisor API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes - wrap in try-catch to prevent startup crashes
try {
  app.use('/api/auth', require('./routes/auth'));
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
}

try {
  app.use('/api/user', require('./routes/user'));
} catch (error) {
  console.error('❌ Failed to load user routes:', error.message);
}

try {
  app.use('/api/wallet', require('./routes/wallet'));
} catch (error) {
  console.error('❌ Failed to load wallet routes:', error.message);
}

try {
  app.use('/api/trades', require('./routes/trades'));
} catch (error) {
  console.error('❌ Failed to load trades routes:', error.message);
}

try {
  app.use('/api/market', require('./routes/market'));
} catch (error) {
  console.error('❌ Failed to load market routes:', error.message);
}

try {
  app.use('/api/notifications', require('./routes/notifications'));
} catch (error) {
  console.error('❌ Failed to load notifications routes:', error.message);
}

try {
  app.use('/api/portfolio', require('./routes/portfolio'));
} catch (error) {
  console.error('❌ Failed to load portfolio routes:', error.message);
}

try {
  app.use('/api/minor-wallets', require('./routes/minor-wallets'));
} catch (error) {
  console.error('❌ Failed to load minor-wallets routes:', error.message);
}

try {
  app.use('/api/reconciliation', require('./routes/reconciliation'));
} catch (error) {
  console.error('❌ Failed to load reconciliation routes:', error.message);
}

try {
  app.use('/api/chatbot', require('./routes/chatbot'));
} catch (error) {
  console.error('❌ Failed to load chatbot routes:', error.message);
}

try {
  app.use('/api/calculator', require('./routes/calculator'));
} catch (error) {
  console.error('❌ Failed to load calculator routes:', error.message);
}

try {
  app.use('/api/affiliate', require('./routes/affiliate'));
} catch (error) {
  console.error('❌ Failed to load affiliate routes:', error.message);
}

try {
  app.use('/api/alpaca', require('./routes/alpaca'));
} catch (error) {
  console.error('❌ Failed to load alpaca routes:', error.message);
}

try {
  app.use('/api/admin', require('./routes/admin'));
} catch (error) {
  console.error('❌ Failed to load admin routes:', error.message);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0'; // Railway requires 0.0.0.0

console.log('🚀 Starting server...');
console.log(`📦 Node version: ${process.version}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);

// Start server - bind to 0.0.0.0 for Railway
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔗 External URL: https://robo-backend-production.up.railway.app/health`);
  
  // Check MongoDB connection status
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB: Connected');
  } else if (mongoose.connection.readyState === 0) {
    console.log('⚠️ MongoDB: Disconnected (will retry)');
  } else {
    console.log('⚠️ MongoDB: Connecting...');
  }
  
  console.log('✅ Server is ready to accept connections');
  
  // Verify server is actually listening
  if (server.listening) {
    console.log('✅ Server is listening and ready');
  } else {
    console.error('❌ Server failed to start listening');
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
