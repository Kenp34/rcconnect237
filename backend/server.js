const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configuration Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://rcconnect237-pv5i.vercel.app/',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin:process.env.CLIENT_URL || 'https://rcconnect237-pv5i.vercel.app/' ,
  credentials:true
}));

app.get('/',(req,res) =>{
   res.json({message: 'RCconnect API'})
}

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rendre io accessible dans les routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/groups', require('./routes/groups'));

// Socket.io
require('./socket/index')(io);

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    server.listen(5001, () => {
      console.log('✅ Serveur démarré sur http://localhost:5001',MONGODB_URI);
    });
  })
  .catch(err => console.error('❌ Erreur MongoDB:', err));
