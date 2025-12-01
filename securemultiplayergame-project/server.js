require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// security middleware
app.use(helmet({
  noCache: true,
  hidePoweredBy: { setTo: 'PHP 7.4.3' }
}));

// additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

// socket.io setup
const io = socket(server);
let players = {};
let collectibles = [];
let collectibleId = 0;

// import classes
const Player = require('./public/Player.mjs').default || require('./public/Player.mjs');
const Collectible = require('./public/Collectible.mjs').default || require('./public/Collectible.mjs');

// create initial collectible
function createCollectible() {
  const x = Math.floor(Math.random() * 700) + 50;
  const y = Math.floor(Math.random() * 500) + 50;
  const value = Math.floor(Math.random() * 10) + 1;
  const id = collectibleId++;
  
  const collectible = new Collectible({ x, y, value, id });
  collectibles.push(collectible);
  return collectible;
}

// initialize with some collectibles
for (let i = 0; i < 5; i++) {
  createCollectible();
}

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  // create new player
  const x = Math.floor(Math.random() * 700) + 50;
  const y = Math.floor(Math.random() * 500) + 50;
  const newPlayer = new Player({ x, y, score: 0, id: socket.id });
  players[socket.id] = newPlayer;
  
  // send current game state to new player
  socket.emit('init', {
    player: newPlayer,
    players: players,
    collectibles: collectibles
  });
  
  // notify other players
  socket.broadcast.emit('playerJoined', newPlayer);
  
  // handle player movement
  socket.on('move', (data) => {
    if (players[socket.id]) {
      const { direction, speed } = data;
      players[socket.id].movePlayer(direction, speed);
      
      // check for collisions with collectibles
      collectibles.forEach((collectible, index) => {
        if (players[socket.id].collision(collectible)) {
          players[socket.id].score += collectible.value;
          
          // remove collected item and create new one
          collectibles.splice(index, 1);
          const newCollectible = createCollectible();
          
          // broadcast updates
          io.emit('collectibleCollected', {
            playerId: socket.id,
            collectibleId: collectible.id,
            newCollectible: newCollectible,
            score: players[socket.id].score
          });
        }
      });
      
      // broadcast updated position
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: players[socket.id].x,
        y: players[socket.id].y,
        score: players[socket.id].score
      });
    }
  });
  
  // handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

module.exports = app; // For testing
