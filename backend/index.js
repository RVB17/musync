// backend/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const authRouter = require('./auth');
const groupsRouter = require('./groups');
const partiesRouter = require('./parties');
const usersRouter = require('./users');
const invitesRouter = require('./invites');
const recommendRoutes = require('./routes/recommend');
const requireAuth = require('./authMiddleware');

app.use('/auth', authRouter);

// Apply auth middleware to protect these routes
app.use('/groups', requireAuth, groupsRouter);
app.use('/parties', requireAuth, partiesRouter);
app.use('/users', usersRouter); // Some user routes (like signup/login) might need to remain open, handle inside users.js
app.use('/', requireAuth, invitesRouter);
app.use('/api/recommend', requireAuth, recommendRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on 0.0.0.0:${PORT}`);
});
