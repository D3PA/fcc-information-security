class Player {
  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    this.width = 30;
    this.height = 30;
  }

  movePlayer(dir, speed) {
    switch(dir) {
      case 'up':
        this.y -= speed;
        break;
      case 'down':
        this.y += speed;
        break;
      case 'left':
        this.x -= speed;
        break;
      case 'right':
        this.x += speed;
        break;
    }
  }

  collision(item) {
    // simple rectangle collision detection
    return (
      this.x < item.x + 20 &&
      this.x + this.width > item.x &&
      this.y < item.y + 20 &&
      this.y + this.height > item.y
    );
  }

  calculateRank(arr) {
    // sort players by score (descending)
    const sorted = [...arr].sort((a, b) => b.score - a.score);
    
    // find current player rank
    const rank = sorted.findIndex(player => player.id === this.id) + 1;
    
    return `Rank: ${rank}/${arr.length}`;
  }
}

// export for Node.js (server) and ES6 (browser)
try {
  module.exports = Player;
} catch(e) {}

export default Player;
