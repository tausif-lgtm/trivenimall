require('dotenv').config();
process.env.TZ = 'Asia/Kolkata'; // IST
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Attach io to app so controllers can access it
app.set('io', io);

// Socket.IO auth + room join
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  if (socket.user) {
    const room = `user_${socket.user.id}`;
    socket.join(room);
    // Admin joins admin room too
    if (socket.user.role === 'admin') {
      socket.join('admin_room');
    }
  }
  socket.on('disconnect', () => {});
});

// Export io for use in controllers
module.exports.io = io;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/construction', express.static(path.join(__dirname, 'uploads/construction')));
app.use('/uploads/checklists', express.static(path.join(__dirname, 'uploads/checklists')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/flats', require('./routes/flats'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/construction', require('./routes/construction'));
app.use('/api/communication', require('./routes/communication'));
app.use('/api/webhook', require('./routes/webhook'));

// Mall Operations Routes
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/footfall', require('./routes/footfall'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/parking', require('./routes/parking'));

// Start checklist daily scheduler
require('./services/checklistScheduler').start();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Alcove Triveni Mall Operations API is running.', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.29.93:${PORT}`);
});
