const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const http       = require('http');      // Serveur HTTP natif Node
const { Server } = require('socket.io'); // Socket.io

const app    = express();
const server = http.createServer(app);  // Serveur HTTP qui englobe Express


// Attacher Socket.io au serveur HTTP
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});



app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Rendre io accessible dans les routes via req.app.get('io')
app.set('io', io);


const PORT = process.env.PORT || 5001;


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts',require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));
//app.use('/api/notifications', require('./routes/notifications'));

//app.use('/api/groups',require('./routes/groups'));

// Logique Socket.io
require('./socket/index')(io);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => server.listen(5001, () => console.log('Serveur démarré sur port 5001')))
  .catch(err => console.error(err));



  /*
app.listen(PORT, () => {
  console.log(`Serveur démarré sur <http://localhost>:${PORT}`);
});*/

/*
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(process.env.PORT || 5001,
    () => console.log('Serveur démarré')))
  .catch(err => console.error(err));
  */