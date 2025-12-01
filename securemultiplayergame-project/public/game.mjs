import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let player;
let players = {};
let collectibles = [];

// game constants
const PLAYER_SPEED = 5;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// handle keyboard input
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// process player movement
function processInput() {
  if (keys['ArrowUp'] || keys['w'] || keys['W']) {
    socket.emit('move', { direction: 'up', speed: PLAYER_SPEED });
  }
  if (keys['ArrowDown'] || keys['s'] || keys['S']) {
    socket.emit('move', { direction: 'down', speed: PLAYER_SPEED });
  }
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    socket.emit('move', { direction: 'left', speed: PLAYER_SPEED });
  }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    socket.emit('move', { direction: 'right', speed: PLAYER_SPEED });
  }
}

// draw game objects
function draw() {
  // clear canvas
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // draw collectibles
  collectibles.forEach(collectible => {
    context.fillStyle = '#FFD700'; 
    context.fillRect(collectible.x, collectible.y, 20, 20);
    context.fillStyle = '#000';
    context.font = '12px Arial';
    context.fillText(collectible.value, collectible.x + 5, collectible.y + 15);
  });
  
  // draw players
  Object.values(players).forEach(p => {
    context.fillStyle = p.id === player.id ? '#00FF00' : '#FF0000'; // green for self, red for others
    context.fillRect(p.x, p.y, 30, 30);
    
    // draw player name and score
    context.fillStyle = '#000';
    context.font = '12px Arial';
    context.fillText(`Player ${p.id.substring(0, 5)}: ${p.score}`, p.x, p.y - 5);
    
    // draw rank
    if (p.id === player.id) {
      const rankText = p.calculateRank(Object.values(players));
      context.fillText(rankText, p.x, p.y + 40);
    }
  });
}

// game loop
function gameLoop() {
  processInput();
  draw();
  requestAnimationFrame(gameLoop);
}

// socket event handlers
socket.on('init', (data) => {
  player = data.player;
  players = data.players;
  collectibles = data.collectibles;
  console.log('Game initialized');
});

socket.on('playerJoined', (newPlayer) => {
  players[newPlayer.id] = newPlayer;
});

socket.on('playerMoved', (data) => {
  if (players[data.id]) {
    players[data.id].x = data.x;
    players[data.id].y = data.y;
    players[data.id].score = data.score;
  }
});

socket.on('collectibleCollected', (data) => {
  // update player score
  if (players[data.playerId]) {
    players[data.playerId].score = data.score;
  }
  
  // remove collected collectible and add new one
  collectibles = collectibles.filter(c => c.id !== data.collectibleId);
  collectibles.push(data.newCollectible);
});

socket.on('playerLeft', (playerId) => {
  delete players[playerId];
});

// start game
gameLoop();
