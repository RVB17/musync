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

// Import and use auth, group, party, and user routes
const authRouter = require('./auth');
const groupsRouter = require('./groups');
const partiesRouter = require('./parties');
const usersRouter = require('./users');
const invitesRouter = require('./invites');

app.use('/auth', authRouter);
app.use('/groups', groupsRouter);
app.use('/parties', partiesRouter);
app.use('/users', usersRouter);
app.use('/', invitesRouter);

// Add recommendation routes
const recommendRoutes = require('./routes/recommend');
app.use('/api/recommend', recommendRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on 0.0.0.0:${PORT}`);
});
