class Collectible {
  constructor({x, y, value, id}) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.id = id;
    this.width = 20;
    this.height = 20;
  }
}

// export for Node.js (server) and ES6 (browser)
try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
