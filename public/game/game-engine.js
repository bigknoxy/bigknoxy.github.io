var p = Object.defineProperty;
var y = (r, t, e) => t in r ? p(r, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : r[t] = e;
var a = (r, t, e) => y(r, typeof t != "symbol" ? t + "" : t, e);
class u {
  constructor(t, e) {
    a(this, "position");
    a(this, "size");
    a(this, "velocity");
    a(this, "active", !0);
    a(this, "type");
    a(this, "id");
    this.position = { ...t.position }, this.size = { ...t.size }, this.velocity = t.velocity ? { ...t.velocity } : { x: 0, y: 0 }, this.active = t.active !== void 0 ? t.active : !0, this.type = e, this.id = this.generateId();
  }
  /**
   * Generate unique ID for entity
   */
  generateId() {
    return `${this.type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  /**
   * Get bounding box for collision detection
   */
  getBoundingBox() {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height
    };
  }
  /**
   * Check if this entity collides with another
   */
  collidesWith(t) {
    const e = this.getBoundingBox(), i = t.getBoundingBox();
    return e.x < i.x + i.width && e.x + e.width > i.x && e.y < i.y + i.height && e.y + e.height > i.y;
  }
  /**
   * Check if entity is visible on screen
   */
  isVisible(t, e) {
    return this.position.x + this.size.width >= 0 && this.position.x <= t && this.position.y + this.size.height >= 0 && this.position.y <= e;
  }
  /**
   * Reset entity state
   */
  reset() {
    this.active = !0, this.velocity = { x: 0, y: 0 };
  }
  /**
   * Destroy entity - mark as inactive
   */
  destroy() {
    this.active = !1;
  }
  /**
   * Get distance to another entity
   */
  distanceTo(t) {
    const e = this.position.x - t.position.x, i = this.position.y - t.position.y;
    return Math.sqrt(e * e + i * i);
  }
  /**
   * Move entity by given amount
   */
  move(t, e) {
    this.position.x += t, this.position.y += e;
  }
  /**
   * Set position
   */
  setPosition(t, e) {
    this.position.x = t, this.position.y = e;
  }
  /**
   * Set velocity
   */
  setVelocity(t, e) {
    this.velocity.x = t, this.velocity.y = e;
  }
}
class m extends u {
  constructor(e) {
    super(e, "player");
    a(this, "jumpPower");
    a(this, "groundY");
    a(this, "isJumping", !1);
    a(this, "animationFrame", 0);
    a(this, "animationTimer", 0);
    this.jumpPower = e.jumpPower, this.groundY = e.groundY;
  }
  /**
   * Update player physics and animation
   */
  update(e, i) {
    this.velocity.y += 0.8, this.position.y += this.velocity.y, this.position.y >= this.groundY && (this.position.y = this.groundY, this.velocity.y = 0, this.isJumping = !1), this.animationTimer += e, this.animationTimer > 100 && (this.animationFrame = (this.animationFrame + 1) % 2, this.animationTimer = 0);
  }
  /**
   * Render player as pixel art character
   */
  render(e) {
    e.fillStyle = "#0f380f", e.fillRect(this.position.x + 4, this.position.y + 8, 12, 8), e.fillRect(this.position.x + 6, this.position.y + 2, 8, 6), this.isJumping ? (e.fillRect(this.position.x + 6, this.position.y + 16, 3, 4), e.fillRect(this.position.x + 11, this.position.y + 16, 3, 4)) : this.animationFrame === 0 ? (e.fillRect(this.position.x + 6, this.position.y + 16, 3, 4), e.fillRect(this.position.x + 11, this.position.y + 16, 3, 4)) : (e.fillRect(this.position.x + 5, this.position.y + 16, 3, 4), e.fillRect(this.position.x + 12, this.position.y + 16, 3, 4)), e.fillStyle = "#9bbc0f", e.fillRect(this.position.x + 7, this.position.y + 4, 2, 1), e.fillRect(this.position.x + 11, this.position.y + 4, 2, 1);
  }
  /**
   * Make the player jump
   */
  jump() {
    this.isJumping || (this.velocity.y = this.jumpPower, this.isJumping = !0);
  }
  /**
   * Check if player can jump
   */
  canJump() {
    return !this.isJumping;
  }
  /**
   * Move player horizontally
   */
  moveLeft() {
    this.velocity.x = -3;
  }
  moveRight() {
    this.velocity.x = 3;
  }
  stopHorizontalMovement() {
    this.velocity.x = 0;
  }
  /**
   * Reset player to initial state
   */
  reset() {
    super.reset(), this.velocity = { x: 0, y: 0 }, this.isJumping = !1, this.animationFrame = 0, this.animationTimer = 0;
  }
  /**
   * Get bounding box for collision detection
   * Aligns collision box with visual sprite (feet at bottom)
   */
  getBoundingBox() {
    return {
      x: this.position.x,
      y: this.position.y,
      // Full height for accurate ground collision
      width: this.size.width,
      height: this.size.height
      // Full height to match visual sprite
    };
  }
  /**
   * Check if player is on ground
   */
  isOnGround() {
    return this.position.y >= this.groundY;
  }
}
class g extends u {
  constructor(e) {
    super(e, "obstacle");
    a(this, "obstacleType");
    a(this, "animationFrame", 0);
    a(this, "animationTimer", 0);
    this.obstacleType = e.type;
  }
  /**
   * Update obstacle movement and animation
   */
  update(e, i) {
    this.position.x -= i, this.animationTimer += e, this.animationTimer > 200 && (this.animationFrame = (this.animationFrame + 1) % 2, this.animationTimer = 0), this.position.x + this.size.width < 0 && (this.active = !1);
  }
  /**
   * Render obstacle based on type
   */
  render(e) {
    e.fillStyle = "#0f380f", this.obstacleType === "bug" ? this.renderBug(e) : this.renderErrorBlock(e);
  }
  /**
   * Render bug sprite
   */
  renderBug(e) {
    const i = this.position.x, s = this.position.y;
    e.fillStyle = "#0f380f", e.fillRect(i + 2, s + 2, 12, 16), e.fillRect(i + 4, s, 8, 2), e.fillRect(i + 2, s + 18, 12, 2), e.fillStyle = "#8bac0f", e.fillRect(i + 4, s + 4, 8, 6), e.fillStyle = "#306230", e.fillRect(i + 4, s + 12, 2, 2), e.fillRect(i + 6, s + 12, 2, 2), e.fillRect(i + 4, s + 14, 2, 2), e.fillRect(i + 8, s + 12, 2, 2), e.fillRect(i + 10, s + 12, 2, 2), e.fillRect(i + 12, s + 14, 2, 2), e.fillRect(i + 14, s + 12, 2, 2), e.fillStyle = "#9bbc0f", this.animationFrame === 0 ? (e.fillRect(i + 5, s + 5, 2, 2), e.fillRect(i + 9, s + 7, 2, 2), e.fillRect(i + 6, s + 8, 1, 1)) : (e.fillRect(i + 7, s + 5, 2, 2), e.fillRect(i + 5, s + 8, 2, 2), e.fillRect(i + 9, s + 6, 1, 1)), e.fillStyle = "#0f380f", e.fillRect(i + 6, s, 4, 2), e.fillRect(i + 3, s + 1, 10, 1);
  }
  /**
   * Render error block sprite
   */
  renderErrorBlock(e) {
    const i = this.position.x, s = this.position.y;
    e.fillStyle = "#0f380f", e.fillRect(i + 2, s + 2, 12, 12), e.fillRect(i, s, 16, 2), e.fillRect(i, s + 14, 16, 2), e.fillRect(i, s + 2, 2, 12), e.fillRect(i + 14, s + 2, 2, 12), e.fillStyle = "#8bac0f", e.fillRect(i + 4, s + 2, 8, 6), e.fillStyle = "#0f380f", e.fillRect(i + 6, s + 14, 4, 2), e.fillRect(i + 4, s + 16, 8, 2), e.fillRect(i + 7, s + 17, 2, 1), e.fillStyle = "#9bbc0f", this.animationFrame === 0 ? (e.fillRect(i + 5, s + 5, 6, 1), e.fillRect(i + 5, s + 8, 6, 1), e.fillRect(i + 5, s + 5, 1, 4), e.fillRect(i + 10, s + 5, 1, 4), e.fillRect(i + 7, s + 7, 2, 1)) : (e.fillRect(i + 6, s + 6, 4, 2), e.fillRect(i + 7, s + 7, 2, 1)), e.fillStyle = "#306230", e.fillRect(i + 3, s + 3, 10, 1), e.fillRect(i + 3, s + 10, 10, 1), e.fillRect(i + 1, s + 4, 1, 6), e.fillRect(i + 14, s + 4, 1, 6);
  }
  /**
   * Reset obstacle to initial state
   */
  reset() {
    super.reset(), this.animationFrame = 0, this.animationTimer = 0;
  }
  /**
   * Set obstacle position (for spawning)
   */
  setSpawnPosition(e, i) {
    this.position.x = e, this.position.y = i, this.active = !0;
  }
  /**
   * Get obstacle difficulty score
   */
  getDifficulty() {
    return this.obstacleType === "bug" ? 1 : 2;
  }
}
class b extends u {
  constructor(e) {
    super(e, "collectible");
    a(this, "collectibleType");
    a(this, "points");
    a(this, "animationFrame", 0);
    a(this, "animationTimer", 0);
    a(this, "collected", !1);
    this.collectibleType = e.type, this.points = e.points;
  }
  /**
   * Update collectible animation and movement
   */
  update(e, i) {
    this.position.x -= i, this.animationTimer += e, this.animationTimer > 100 && (this.animationFrame = (this.animationFrame + 1) % 4, this.animationTimer = 0);
    const s = Math.sin(this.animationFrame * Math.PI / 2) * 2;
    this.position.y += s * 0.1, this.position.x + this.size.width < 0 && (this.active = !1);
  }
  /**
   * Render collectible based on type
   */
  render(e) {
    this.collected || (this.collectibleType === "commit" ? this.renderCommit(e) : this.renderStar(e));
  }
  /**
   * Render commit icon (git commit symbol)
   */
  renderCommit(e) {
    const i = this.position.x, s = this.position.y;
    e.fillStyle = "#8bac0f", e.fillRect(i + 4, s + 4, 8, 8), e.fillStyle = "#9bbc0f", this.animationFrame % 2 === 0 ? e.fillRect(i + 6, s + 6, 4, 4) : e.fillRect(i + 7, s + 7, 2, 2), e.fillStyle = "#306230", e.fillRect(i + 2, s + 7, 2, 2), e.fillRect(i + 12, s + 7, 2, 2), e.fillRect(i + 7, s + 2, 2, 2), e.fillRect(i + 7, s + 12, 2, 2), (this.animationFrame === 0 || this.animationFrame === 2) && (e.fillStyle = "#9bbc0f", e.fillRect(i + 14, s + 2, 1, 1), e.fillRect(i + 1, s + 13, 1, 1));
  }
  /**
   * Render star icon
   */
  renderStar(e) {
    const i = this.position.x, s = this.position.y;
    e.fillStyle = "#8bac0f", e.fillRect(i + 7, s + 7, 2, 2), this.animationFrame % 2 === 0 ? (e.fillRect(i + 7, s + 2, 2, 3), e.fillRect(i + 7, s + 11, 2, 3), e.fillRect(i + 2, s + 7, 3, 2), e.fillRect(i + 11, s + 7, 3, 2)) : (e.fillRect(i + 7, s + 3, 2, 2), e.fillRect(i + 7, s + 11, 2, 2), e.fillRect(i + 3, s + 7, 2, 2), e.fillRect(i + 11, s + 7, 2, 2)), e.fillRect(i + 4, s + 4, 2, 2), e.fillRect(i + 10, s + 4, 2, 2), e.fillRect(i + 4, s + 10, 2, 2), e.fillRect(i + 10, s + 10, 2, 2), (this.animationFrame === 1 || this.animationFrame === 3) && (e.fillStyle = "#9bbc0f", e.fillRect(i + 6, s + 6, 4, 4));
  }
  /**
   * Mark collectible as collected
   */
  collect() {
    this.collected = !0, this.active = !1;
  }
  /**
   * Reset collectible to initial state
   */
  reset() {
    super.reset(), this.collected = !1, this.animationFrame = 0, this.animationTimer = 0;
  }
  /**
   * Set collectible position (for spawning)
   */
  setSpawnPosition(e, i) {
    this.position.x = e, this.position.y = i, this.active = !0, this.collected = !1;
  }
  /**
   * Get collectible value
   */
  getValue() {
    return this.points;
  }
  /**
   * Check if collectible can be collected
   */
  canCollect() {
    return this.active && !this.collected;
  }
}
class w {
  constructor(t = 0.8, e = 0.9) {
    a(this, "gravity");
    a(this, "friction");
    this.gravity = t, this.friction = e;
  }
  /**
   * Check AABB collision between two entities
   */
  checkCollision(t, e) {
    const i = t.getBoundingBox(), s = e.getBoundingBox();
    return i.x < s.x + s.width && i.x + i.width > s.x && i.y < s.y + s.height && i.y + i.height > s.y;
  }
  /**
   * Check collision between bounding boxes
   */
  checkBoxCollision(t, e) {
    return t.x < e.x + e.width && t.x + t.width > e.x && t.y < e.y + e.height && t.y + t.height > e.y;
  }
  /**
   * Get collision side information
   */
  getCollisionSide(t, e) {
    const i = t.getBoundingBox(), s = e.getBoundingBox(), n = Math.min(
      i.x + i.width - s.x,
      s.x + s.width - i.x
    ), o = Math.min(
      i.y + i.height - s.y,
      s.y + s.height - i.y
    );
    return n <= 0 || o <= 0 ? "none" : n < o ? i.x < s.x ? "left" : "right" : i.y < s.y ? "top" : "bottom";
  }
  /**
   * Apply gravity to an entity
   */
  applyGravity(t, e) {
    t.velocity.y += this.gravity * (e / 16.67);
  }
  /**
   * Apply friction to an entity's velocity
   */
  applyFriction(t) {
    t.velocity.x *= this.friction, t.velocity.y *= this.friction;
  }
  /**
   * Clamp velocity to maximum values
   */
  clampVelocity(t, e) {
    t.velocity.x = Math.max(
      -e.x,
      Math.min(e.x, t.velocity.x)
    ), t.velocity.y = Math.max(
      -e.y,
      Math.min(e.y, t.velocity.y)
    );
  }
  /**
   * Check if entity is grounded (on top of another entity)
   */
  isGrounded(t, e) {
    const i = t.getBoundingBox(), s = e.getBoundingBox();
    return i.y + i.height >= s.y - 1 && i.y + i.height <= s.y + 5 && i.x + i.width > s.x && i.x < s.x + s.width;
  }
  /**
   * Check if entity is grounded on a Y coordinate
   */
  isGroundedOnY(t, e) {
    return t.position.y + t.size.height >= e - 1;
  }
  /**
   * Resolve collision by separating entities
   */
  resolveCollision(t, e) {
    const i = this.getCollisionSide(t, e), s = t.getBoundingBox(), n = e.getBoundingBox();
    switch (i) {
      case "left":
        t.position.x = n.x - s.width, t.velocity.x = 0;
        break;
      case "right":
        t.position.x = n.x + n.width, t.velocity.x = 0;
        break;
      case "top":
        t.position.y = n.y - s.height, t.velocity.y = 0;
        break;
      case "bottom":
        t.position.y = n.y + n.height, t.velocity.y = 0;
        break;
    }
  }
  /**
   * Calculate distance between two entities
   */
  getDistance(t, e) {
    const i = t.position.x - e.position.x, s = t.position.y - e.position.y;
    return Math.sqrt(i * i + s * s);
  }
  /**
   * Check if entities are within a certain distance
   */
  isWithinRange(t, e, i) {
    return this.getDistance(t, e) <= i;
  }
  /**
   * Get the center point of an entity
   */
  getCenter(t) {
    return {
      x: t.position.x + t.size.width / 2,
      y: t.position.y + t.size.height / 2
    };
  }
  /**
   * Check if a point is inside an entity
   */
  isPointInside(t, e) {
    const i = t.getBoundingBox();
    return e.x >= i.x && e.x <= i.x + i.width && e.y >= i.y && e.y <= i.y + i.height;
  }
  /**
   * Raycast from a point in a direction
   */
  raycast(t, e, i, s) {
    const n = this.normalize(e);
    let o = null, h = i, f = {
      x: t.x + n.x * i,
      y: t.y + n.y * i
    };
    for (const c of s) {
      if (!c.active) continue;
      const l = this.rayBoxIntersection(
        t,
        n,
        c
      );
      l && l.distance < h && (o = c, h = l.distance, f = l.point);
    }
    return {
      entity: o,
      distance: h,
      point: f
    };
  }
  /**
   * Normalize a vector
   */
  normalize(t) {
    const e = Math.sqrt(t.x * t.x + t.y * t.y);
    return e === 0 ? { x: 0, y: 0 } : {
      x: t.x / e,
      y: t.y / e
    };
  }
  /**
   * Simple ray-box intersection
   */
  rayBoxIntersection(t, e, i) {
    const s = this.getCenter(i), n = {
      x: s.x - t.x,
      y: s.y - t.y
    }, o = n.x * e.x + n.y * e.y;
    if (o < 0) return null;
    const h = {
      x: t.x + e.x * o,
      y: t.y + e.y * o
    };
    return this.isPointInside(i, h) ? {
      distance: o,
      point: h
    } : null;
  }
}
class k {
  constructor(t, e, i, s) {
    a(this, "ctx");
    a(this, "config");
    a(this, "width");
    a(this, "height");
    a(this, "backBuffer", null);
    a(this, "backBufferCanvas", null);
    a(this, "flashAlpha", 0);
    a(this, "flashColor", "#ff0000");
    this.ctx = t, this.width = e, this.height = i, this.config = s, s.doubleBuffering && this.setupDoubleBuffering(), this.setupContext();
  }
  /**
   * Setup double buffering for smoother rendering
   */
  setupDoubleBuffering() {
    typeof window > "u" || typeof document > "u" || (this.backBufferCanvas = document.createElement("canvas"), this.backBufferCanvas.width = this.width, this.backBufferCanvas.height = this.height, this.backBuffer = this.backBufferCanvas.getContext("2d"), this.backBuffer && this.setupContext(this.backBuffer));
  }
  /**
   * Setup rendering context with pixelated scaling
   */
  setupContext(t) {
    const e = t || this.ctx;
    e.imageSmoothingEnabled = !1, e.imageRendering = "pixelated", e.imageRendering = "-moz-crisp-edges", e.imageRendering = "crisp-edges";
  }
  /**
   * Begin rendering frame
   */
  beginFrame() {
    const t = this.backBuffer || this.ctx;
    t.fillStyle = "#9bbc0f", t.fillRect(0, 0, this.width, this.height);
  }
  /**
   * End rendering frame and swap buffers if needed
   */
  endFrame() {
    if (this.flashAlpha > 0) {
      const t = this.backBuffer || this.ctx;
      t.save(), t.globalAlpha = this.flashAlpha, t.fillStyle = this.flashColor, t.fillRect(0, 0, this.width, this.height), t.restore(), this.flashAlpha = Math.max(0, this.flashAlpha - 0.05);
    }
    this.backBuffer && this.backBufferCanvas && this.ctx.drawImage(this.backBufferCanvas, 0, 0);
  }
  /**
   * Render an entity
   */
  renderEntity(t) {
    if (!t.active) return;
    const e = this.backBuffer || this.ctx;
    t.render(e), this.config.showHitboxes && this.drawHitbox(t);
  }
  /**
   * Render multiple entities
   */
  renderEntities(t) {
    for (const e of t)
      this.renderEntity(e);
  }
  /**
   * Draw entity hitbox for debugging
   */
  drawHitbox(t) {
    const e = this.backBuffer || this.ctx, i = t.getBoundingBox();
    e.strokeStyle = "#f7768e", e.lineWidth = 1, e.strokeRect(i.x, i.y, i.width, i.height), e.fillStyle = "#f7768e";
    const s = {
      x: i.x + i.width / 2,
      y: i.y + i.height / 2
    };
    e.fillRect(s.x - 1, s.y - 1, 2, 2);
  }
  /**
   * Draw ground
   */
  drawGround(t) {
    const e = this.backBuffer || this.ctx;
    e.fillStyle = "#306230", e.fillRect(0, t, this.width, this.height - t), e.strokeStyle = "#0f380f", e.lineWidth = 1;
    for (let i = 0; i < this.width; i += 16)
      e.beginPath(), e.moveTo(i, t), e.lineTo(i + 8, t + 8), e.stroke();
  }
  /**
   * Draw UI text
   */
  drawText(t, e, i, s) {
    const n = this.backBuffer || this.ctx;
    n.fillStyle = (s == null ? void 0 : s.color) || "#0f380f", n.font = (s == null ? void 0 : s.font) || `${(s == null ? void 0 : s.size) || 12}px "Press Start 2P", monospace`, n.textAlign = (s == null ? void 0 : s.align) || "left", n.textBaseline = (s == null ? void 0 : s.baseline) || "top", n.fillText(t, e, i);
  }
  /**
   * Draw score display
   */
  drawScore(t, e = 10, i = 25) {
    this.drawText(`SCORE: ${t.toString().padStart(4, "0")}`, e, i, {
      color: "#0f380f",
      size: 16
    });
  }
  /**
   * Draw FPS counter
   */
  drawFPS(t) {
    this.config.showFPS && this.drawText(`FPS: ${Math.round(t)}`, this.width - 80, 10, {
      color: "#306230",
      size: 10,
      align: "right"
    });
  }
  /**
   * Draw game over overlay
   */
  drawGameOver(t) {
    const e = this.backBuffer || this.ctx;
    e.fillStyle = "rgba(15, 56, 15, 0.8)", e.fillRect(0, 0, this.width, this.height);
    const i = Math.max(12, Math.min(24, this.width / 12)), s = Math.max(8, Math.min(16, this.width / 20)), n = Math.max(6, Math.min(12, this.width / 24));
    this.drawText("GAME OVER", this.width / 2, this.height / 2 - 20, {
      color: "#9bbc0f",
      size: i,
      align: "center"
    }), this.drawText(
      `FINAL: ${t.toString().padStart(4, "0")}`,
      this.width / 2,
      this.height / 2 + 10,
      {
        color: "#9bbc0f",
        size: s,
        align: "center"
      }
    ), this.drawText("CLICK TO RESTART", this.width / 2, this.height / 2 + 40, {
      color: "#9bbc0f",
      size: n,
      align: "center"
    });
  }
  /**
   * Draw pause overlay
   */
  drawPause() {
    const t = this.backBuffer || this.ctx;
    t.fillStyle = "rgba(15, 56, 15, 0.6)", t.fillRect(0, 0, this.width, this.height), this.drawText("PAUSED", this.width / 2 - 40, this.height / 2, {
      color: "#9bbc0f",
      size: 16,
      align: "center"
    });
  }
  /**
   * Draw particle effects
   */
  drawParticles(t) {
    const e = this.backBuffer || this.ctx;
    for (const i of t)
      i.life <= 0 || (e.globalAlpha = i.life, e.fillStyle = i.color, e.fillRect(
        Math.round(i.position.x),
        Math.round(i.position.y),
        i.size,
        i.size
      ));
    e.globalAlpha = 1;
  }
  /**
   * Draw background elements
   */
  drawBackground(t) {
    const e = this.backBuffer || this.ctx;
    e.fillStyle = "#8bac0f";
    for (let i = 0; i < 5; i++) {
      const s = (t * 0.5 + i * 100) % (this.width + 20) - 20, n = 20 + i * 15;
      e.fillRect(s, n, 20, 8), e.fillRect(s - 5, n + 3, 8, 5), e.fillRect(s + 17, n + 3, 8, 5);
    }
  }
  /**
   * Resize render system
   */
  resize(t, e) {
    this.width = t, this.height = e, this.backBufferCanvas && (this.backBufferCanvas.width = t, this.backBufferCanvas.height = e);
  }
  /**
   * Get render context
   */
  getContext() {
    return this.ctx;
  }
  /**
   * Get back buffer context (if available)
   */
  getBackBuffer() {
    return this.backBuffer;
  }
  /**
   * Trigger a flash effect
   */
  triggerFlash(t = "#ff0000", e = 0.8) {
    this.flashColor = t, this.flashAlpha = e;
  }
  /**
   * Clear entire screen
   */
  clear() {
    (this.backBuffer || this.ctx).clearRect(0, 0, this.width, this.height);
  }
  /**
   * Set pixel for pixel-perfect rendering
   */
  setPixel(t, e, i) {
    const s = this.backBuffer || this.ctx;
    s.fillStyle = i, s.fillRect(Math.floor(t), Math.floor(e), 1, 1);
  }
  /**
   * Draw line for debugging
   */
  drawLine(t, e, i, s, n = "#f7768e") {
    const o = this.backBuffer || this.ctx;
    o.strokeStyle = n, o.lineWidth = 1, o.beginPath(), o.moveTo(t, e), o.lineTo(i, s), o.stroke();
  }
}
class S {
  constructor(t) {
    a(this, "audioContext", null);
    a(this, "masterGain", null);
    a(this, "config");
    a(this, "isInitialized", !1);
    a(this, "isSuspended", !0);
    a(this, "onUnmuteCallback");
    this.config = t;
  }
  /**
   * Initialize audio context after user gesture
   */
  async initialize() {
    if (!this.isInitialized)
      try {
        if (typeof window > "u" || !window.AudioContext) {
          console.warn("AudioManager: Web Audio API not supported");
          return;
        }
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)(), this.masterGain = this.audioContext.createGain(), this.masterGain.connect(this.audioContext.destination), this.masterGain.gain.value = this.config.volume, this.audioContext.state === "suspended" ? this.isSuspended = !0 : this.isSuspended = !1, this.isInitialized = !0, console.log("AudioManager: Initialized successfully");
      } catch (t) {
        console.error("AudioManager: Failed to initialize:", t);
      }
  }
  /**
   * Resume audio context (must be called after user gesture)
   */
  async resume() {
    if (!(!this.audioContext || !this.isInitialized))
      try {
        this.audioContext.state === "suspended" && (await this.audioContext.resume(), this.isSuspended = !1, console.log("AudioManager: Audio context resumed"));
      } catch (t) {
        console.error("AudioManager: Failed to resume audio context:", t);
      }
  }
  /**
   * Play a synthesized sound effect
   */
  async playSound(t, e, i = "square", s = 0.2) {
    if (!(!this.isInitialized || !this.audioContext || !this.masterGain || this.isSuspended) && this.config.enabled)
      try {
        const n = this.audioContext.createOscillator(), o = this.audioContext.createGain();
        n.connect(o), o.connect(this.masterGain), n.type = i, n.frequency.setValueAtTime(
          t,
          this.audioContext.currentTime
        );
        const h = this.audioContext.currentTime;
        o.gain.setValueAtTime(0, h), o.gain.linearRampToValueAtTime(s, h + 0.01), o.gain.exponentialRampToValueAtTime(s * 0.5, h + 0.05), o.gain.exponentialRampToValueAtTime(0.01, h + e), n.start(h), n.stop(h + e);
      } catch (n) {
        console.error("AudioManager: Failed to play sound:", n);
      }
  }
  /**
   * Play jump sound (rising pitch)
   */
  async playJump() {
    await this.playSound(this.config.frequencies.jump, 0.1, "square", 0.15), setTimeout(async () => {
      await this.playSound(
        this.config.frequencies.jump * 1.5,
        0.1,
        "square",
        0.1
      );
    }, 50);
  }
  /**
   * Play collect sound (arpeggio)
   */
  async playCollect() {
    const t = [523, 659, 784];
    for (let e = 0; e < t.length; e++)
      setTimeout(async () => {
        await this.playSound(t[e], 0.1, "square", 0.12);
      }, e * 50);
  }
  /**
   * Play game over sound (descending)
   */
  async playGameOver() {
    const t = [400, 350, 300, 250, 200];
    for (let e = 0; e < t.length; e++)
      setTimeout(async () => {
        await this.playSound(t[e], 0.2, "square", 0.15);
      }, e * 100);
  }
  /**
   * Set master volume
   */
  setVolume(t) {
    this.config.volume = Math.max(0, Math.min(1, t)), this.masterGain && (this.masterGain.gain.value = this.config.volume);
  }
  /**
   * Mute audio
   */
  mute() {
    this.config.enabled = !1;
  }
  /**
   * Unmute audio
   */
  unmute() {
    this.config.enabled = !0, this.onUnmuteCallback && this.onUnmuteCallback();
  }
  /**
   * Set unmute callback
   */
  setUnmuteCallback(t) {
    this.onUnmuteCallback = t;
  }
  /**
   * Check if audio is enabled
   */
  isEnabled() {
    return this.config.enabled && this.isInitialized && !this.isSuspended;
  }
  /**
   * Get current volume level
   */
  getVolume() {
    return this.config.volume;
  }
  /**
   * Check if audio is initialized
   */
  isReady() {
    return this.isInitialized;
  }
  /**
   * Check if audio context is suspended
   */
  isAudioSuspended() {
    return this.isSuspended;
  }
  /**
   * Destroy audio manager
   */
  destroy() {
    this.audioContext && this.audioContext.state !== "closed" && this.audioContext.close(), this.audioContext = null, this.masterGain = null, this.isInitialized = !1, this.isSuspended = !0;
  }
}
class v {
  constructor() {
    a(this, "keys");
    a(this, "callbacks");
    a(this, "isInitialized", !1);
    a(this, "boundHandleKeyDown");
    a(this, "boundHandleKeyUp");
    a(this, "boundHandleMouseDown");
    a(this, "boundHandleMouseUp");
    // Element-level touch handler references
    a(this, "elementTouchHandlers", /* @__PURE__ */ new Map());
    a(this, "lastTriggerTime", /* @__PURE__ */ new Map());
    a(this, "TRIGGER_DEBOUNCE_MS", 100);
    this.keys = {
      left: !1,
      right: !1,
      up: !1,
      down: !1,
      space: !1,
      pause: !1
    }, this.callbacks = /* @__PURE__ */ new Map(), this.boundHandleKeyDown = this.handleKeyDown.bind(this), this.boundHandleKeyUp = this.handleKeyUp.bind(this), this.boundHandleMouseDown = this.handleMouseDown.bind(this), this.boundHandleMouseUp = this.handleMouseUp.bind(this);
  }
  /**
   * Initialize input handlers (call this when DOM is ready)
   */
  initialize() {
    this.isInitialized || typeof window > "u" || (window.addEventListener("keydown", this.boundHandleKeyDown), window.addEventListener("keyup", this.boundHandleKeyUp), window.addEventListener("mousedown", this.boundHandleMouseDown), window.addEventListener("mouseup", this.boundHandleMouseUp), window.addEventListener("contextmenu", (t) => t.preventDefault()), this.isInitialized = !0);
  }
  /**
   * Cleanup input handlers
   */
  destroy() {
    if (!(typeof window > "u")) {
      window.removeEventListener("keydown", this.boundHandleKeyDown), window.removeEventListener("keyup", this.boundHandleKeyUp), window.removeEventListener("mousedown", this.boundHandleMouseDown), window.removeEventListener("mouseup", this.boundHandleMouseUp);
      for (const [t] of this.elementTouchHandlers)
        this.detachFromElement(t);
      this.isInitialized = !1;
    }
  }
  /**
   * Handle keyboard key down
   */
  handleKeyDown(t) {
    switch (t.code) {
      case "ArrowLeft":
      case "KeyA":
        this.keys.left = !0, t.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        this.keys.right = !0, t.preventDefault();
        break;
      case "ArrowUp":
      case "KeyW":
        this.keys.up = !0, t.preventDefault();
        break;
      case "ArrowDown":
      case "KeyS":
        this.keys.down = !0, t.preventDefault();
        break;
      case "Space":
      case "KeyJ":
        this.keys.space = !0, t.preventDefault(), this.triggerCallbacks("jump");
        break;
      case "KeyP":
      case "Escape":
        this.keys.pause = !this.keys.pause, t.preventDefault(), this.triggerCallbacks("pause");
        break;
    }
  }
  /**
   * Handle keyboard key up
   */
  handleKeyUp(t) {
    switch (t.code) {
      case "ArrowLeft":
      case "KeyA":
        this.keys.left = !1;
        break;
      case "ArrowRight":
      case "KeyD":
        this.keys.right = !1;
        break;
      case "ArrowUp":
      case "KeyW":
        this.keys.up = !1;
        break;
      case "ArrowDown":
      case "KeyS":
        this.keys.down = !1;
        break;
      case "Space":
      case "KeyJ":
        this.keys.space = !1;
        break;
    }
  }
  /**
   * Handle touch start (DOM-agnostic - no preventDefault)
   */
  handleTouchStart(t) {
    if (!t.touches || t.touches.length === 0) {
      this.keys.space = !0, this.triggerCallbacks("jump");
      return;
    }
    const i = t.touches[0].clientX, s = window.innerWidth;
    i < s * 0.3 ? this.keys.left = !0 : i > s * 0.7 ? this.keys.right = !0 : (this.keys.space = !0, this.triggerCallbacks("jump"));
  }
  /**
   * Handle touch end (DOM-agnostic - no preventDefault)
   */
  handleTouchEnd(t) {
    this.keys.left = !1, this.keys.right = !1, this.keys.space = !1;
  }
  /**
   * Handle mouse down
   */
  handleMouseDown(t) {
    t.button === 0 && (this.keys.space = !0, this.triggerCallbacks("jump"));
  }
  /**
   * Handle mouse up
   */
  handleMouseUp(t) {
    t.button === 0 && (this.keys.space = !1);
  }
  /**
   * Handle pointer down (unified touch/mouse/stylus input - DOM-agnostic)
   */
  handlePointerDown(t) {
    this.keys.space = !0, this.triggerCallbacks("jump");
  }
  /**
   * Handle pointer up (DOM-agnostic)
   */
  handlePointerUp(t) {
    this.keys.space = !1;
  }
  /**
   * Get current input state
   */
  getInputState() {
    return { ...this.keys };
  }
  /**
   * Check if specific key is pressed
   */
  isPressed(t) {
    return this.keys[t];
  }
  /**
   * Check if any movement key is pressed
   */
  isMoving() {
    return this.keys.left || this.keys.right || this.keys.up || this.keys.down;
  }
  /**
   * Check if jump/action is pressed
   */
  isJumping() {
    return this.keys.space;
  }
  /**
   * Check if pause is toggled
   */
  isPaused() {
    return this.keys.pause;
  }
  /**
   * Get horizontal movement direction
   */
  getHorizontalDirection() {
    return this.keys.left ? -1 : this.keys.right ? 1 : 0;
  }
  /**
   * Get vertical movement direction
   */
  getVerticalDirection() {
    return this.keys.up ? -1 : this.keys.down ? 1 : 0;
  }
  /**
   * Get movement vector
   */
  getMovementVector() {
    return {
      x: this.getHorizontalDirection(),
      y: this.getVerticalDirection()
    };
  }
  /**
   * Reset all input states
   */
  reset() {
    this.keys = {
      left: !1,
      right: !1,
      up: !1,
      down: !1,
      space: !1,
      pause: !1
    };
  }
  /**
   * Register callback for specific action
   */
  onCallback(t, e) {
    this.callbacks.has(t) || this.callbacks.set(t, []), this.callbacks.get(t).push(e);
  }
  /**
   * Remove callback for specific action
   */
  offCallback(t, e) {
    const i = this.callbacks.get(t);
    if (i) {
      const s = i.indexOf(e);
      s > -1 && i.splice(s, 1);
    }
  }
  /**
   * Trigger all callbacks for an action
   */
  triggerCallbacks(t) {
    const e = this.callbacks.get(t);
    e && e.forEach((i) => {
      try {
        i();
      } catch (s) {
        console.error("InputHandler: Error in callback:", s);
      }
    });
  }
  /**
   * Check if input handler is initialized
   */
  isActive() {
    return this.isInitialized;
  }
  /**
   * Get debug information
   */
  getDebugInfo() {
    const t = /* @__PURE__ */ new Map();
    for (const [e, i] of this.callbacks)
      t.set(e, i.length);
    return {
      keys: { ...this.keys },
      callbacks: t,
      initialized: this.isInitialized
    };
  }
  /**
   * Trigger action programmatically (for UI/external calls)
   */
  trigger(t) {
    const e = Date.now(), i = this.lastTriggerTime.get(t) || 0;
    if (t === "space" || t === "jump") {
      if (e - i < this.TRIGGER_DEBOUNCE_MS)
        return;
      this.lastTriggerTime.set(t, e);
    }
    switch (t.toLowerCase()) {
      case "space":
      case "jump":
        this.keys.space = !0, this.triggerCallbacks("jump"), setTimeout(() => {
          this.keys.space = !1;
        }, 50);
        break;
      case "left":
        this.keys.left = !0;
        break;
      case "right":
        this.keys.right = !0;
        break;
      case "up":
        this.keys.up = !0;
        break;
      case "down":
        this.keys.down = !0;
        break;
      case "pause":
      case "start":
        this.keys.pause = !this.keys.pause, this.triggerCallbacks("pause");
        break;
    }
  }
  /**
   * Simulate key press (for testing)
   */
  simulateKeyPress(t, e) {
    this.keys[t] = e, e && (t === "space" || t === "pause") && this.triggerCallbacks(t === "space" ? "jump" : "pause");
  }
  /**
   * Enable/disable specific input
   */
  setEnabled(t, e) {
    e || (this.keys[t] = !1);
  }
  /**
   * Create virtual gamepad interface
   */
  createVirtualGamepad() {
    return {
      onButtonPress: (t) => {
        switch (t.toLowerCase()) {
          case "left":
            this.keys.left = !0;
            break;
          case "right":
            this.keys.right = !0;
            break;
          case "up":
            this.keys.up = !0;
            break;
          case "down":
            this.keys.down = !0;
            break;
          case "a":
          case "jump":
            this.keys.space = !0, this.triggerCallbacks("jump");
            break;
          case "start":
          case "pause":
            this.keys.pause = !this.keys.pause, this.triggerCallbacks("pause");
            break;
        }
      },
      onButtonRelease: (t) => {
        switch (t.toLowerCase()) {
          case "left":
            this.keys.left = !1;
            break;
          case "right":
            this.keys.right = !1;
            break;
          case "up":
            this.keys.up = !1;
            break;
          case "down":
            this.keys.down = !1;
            break;
          case "a":
          case "jump":
            this.keys.space = !1;
            break;
        }
      }
    };
  }
  /**
   * Attach touch/pointer handlers to a specific element
   * These handlers will call preventDefault() to block page scrolling
   */
  attachToElement(t) {
    if (this.elementTouchHandlers.has(t))
      return;
    const e = (o) => {
      o.preventDefault(), this.handleTouchStart(o);
    }, i = (o) => {
      o.preventDefault(), this.handleTouchEnd(o);
    }, s = (o) => {
      o.preventDefault(), this.handlePointerDown(o);
    }, n = (o) => {
      o.preventDefault(), this.handlePointerUp(o);
    };
    this.elementTouchHandlers.set(t, {
      boundTouchStart: e,
      boundTouchEnd: i,
      boundPointerDown: s,
      boundPointerUp: n
    }), t.addEventListener("touchstart", e, { passive: !1 }), t.addEventListener("touchend", i, { passive: !1 }), window.PointerEvent && (t.addEventListener("pointerdown", s, {
      passive: !1
    }), t.addEventListener("pointerup", n, { passive: !1 }));
  }
  /**
   * Detach touch/pointer handlers from a specific element
   */
  detachFromElement(t) {
    const e = this.elementTouchHandlers.get(t);
    e && (t.removeEventListener("touchstart", e.boundTouchStart), t.removeEventListener("touchend", e.boundTouchEnd), window.PointerEvent && (t.removeEventListener("pointerdown", e.boundPointerDown), t.removeEventListener("pointerup", e.boundPointerUp)), this.elementTouchHandlers.delete(t));
  }
}
class x {
  constructor(t, e = 10, i = 100) {
    a(this, "pool", []);
    a(this, "createFn");
    a(this, "maxSize");
    a(this, "activeCount", 0);
    this.createFn = t, this.maxSize = i;
    for (let s = 0; s < e; s++)
      this.pool.push(this.createFn());
  }
  /**
   * Get an object from the pool
   */
  acquire() {
    for (const e of this.pool)
      if (!e.active)
        return e.reset(), e.active = !0, this.activeCount++, e;
    if (this.pool.length < this.maxSize) {
      const e = this.createFn();
      return e.active = !0, this.pool.push(e), this.activeCount++, e;
    }
    console.warn("ObjectPool: Pool at maximum size, forcing reuse");
    const t = this.pool[0];
    return t.reset(), t.active = !0, t;
  }
  /**
   * Return an object to the pool
   */
  release(t) {
    t.active && (t.active = !1, this.activeCount--);
  }
  /**
   * Release all active objects
   */
  releaseAll() {
    for (const t of this.pool)
      t.active = !1;
    this.activeCount = 0;
  }
  /**
   * Get all active objects
   */
  getActive() {
    return this.pool.filter((t) => t.active);
  }
  /**
   * Get all inactive objects
   */
  getInactive() {
    return this.pool.filter((t) => !t.active);
  }
  /**
   * Get total pool size
   */
  getSize() {
    return this.pool.length;
  }
  /**
   * Get number of active objects
   */
  getActiveCount() {
    return this.activeCount;
  }
  /**
   * Get number of inactive objects
   */
  getInactiveCount() {
    return this.pool.length - this.activeCount;
  }
  /**
   * Check if pool is at maximum capacity
   */
  isFull() {
    return this.pool.length >= this.maxSize;
  }
  /**
   * Clear pool (remove all objects)
   */
  clear() {
    this.pool.length = 0, this.activeCount = 0;
  }
  /**
   * Shrink pool to specified size
   */
  shrink(t) {
    t >= this.pool.length || (this.pool = this.pool.slice(0, t), this.activeCount = this.pool.filter((e) => e.active).length);
  }
  /**
   * Expand pool to specified size
   */
  expand(t) {
    if (t <= this.pool.length) return;
    const e = Math.min(t, this.maxSize);
    for (; this.pool.length < e; )
      this.pool.push(this.createFn());
  }
  /**
   * Get pool statistics
   */
  getStats() {
    return {
      total: this.pool.length,
      active: this.activeCount,
      inactive: this.pool.length - this.activeCount,
      maxSize: this.maxSize,
      utilization: this.pool.length > 0 ? this.activeCount / this.pool.length : 0
    };
  }
  /**
   * Iterate over all objects in pool
   */
  forEach(t) {
    this.pool.forEach(t);
  }
  /**
   * Find first object matching predicate
   */
  find(t) {
    return this.pool.find(t);
  }
  /**
   * Find all objects matching predicate
   */
  filter(t) {
    return this.pool.filter(t);
  }
  /**
   * Map over all objects in pool
   */
  map(t) {
    return this.pool.map(t);
  }
  /**
   * Reduce over all objects in pool
   */
  reduce(t, e) {
    return this.pool.reduce(t, e);
  }
}
class d extends x {
  constructor(t, e = 20, i = 200) {
    super(t, e, i);
  }
  /**
   * Get active entities within screen bounds
   */
  getVisible(t, e) {
    return this.getActive().filter((i) => {
      const s = i;
      return s.position && s.size && s.position.x + s.size.width >= 0 && s.position.x <= t && s.position.y + s.size.height >= 0 && s.position.y <= e;
    });
  }
  /**
   * Update all active entities
   */
  updateAll(t, e) {
    this.getActive().forEach((i) => {
      i.update && i.update(t, e);
    });
  }
  /**
   * Render all active entities
   */
  renderAll(t) {
    this.getActive().forEach((e) => {
      e.render && e.render(t);
    });
  }
  /**
   * Clean up off-screen entities
   */
  cleanupOffScreen(t, e) {
    this.getActive().forEach((i) => {
      const s = i;
      s.position && s.size && (s.position.x + s.size.width < -50 || s.position.x > t + 50 || s.position.y > e + 50) && this.release(i);
    });
  }
}
class R {
  constructor(t) {
    a(this, "ctx");
    a(this, "config");
    a(this, "state");
    a(this, "inputHandler");
    a(this, "physicsSystem");
    a(this, "renderSystem");
    a(this, "audioSystem");
    // Unified ground Y coordinate - aligns visual ground with physics
    a(this, "GROUND_Y");
    // Game entities
    a(this, "player", null);
    a(this, "obstacles");
    a(this, "collectibles");
    a(this, "particles", []);
    // Game loop
    a(this, "animationId", null);
    a(this, "lastTime", 0);
    a(this, "accumulator", 0);
    a(this, "fixedTimeStep", 1e3 / 60);
    // 60 FPS
    // Events
    a(this, "eventListeners", /* @__PURE__ */ new Map());
    // High score
    a(this, "highScoreKey", "miniGameHighScore");
    a(this, "onScoreChangeCallback");
    this.ctx = t.canvas.getContext("2d"), this.config = t, this.onScoreChangeCallback = t.onScoreChange, this.GROUND_Y = t.height - 20, this.state = {
      isRunning: !1,
      isPaused: !1,
      score: 0,
      gameSpeed: t.gameSpeed,
      frameCount: 0
    }, this.inputHandler = new v(), this.physicsSystem = new w(t.gravity), this.renderSystem = new k(
      this.ctx,
      t.width,
      t.height,
      t.render
    ), this.audioSystem = new S(t.audio), this.obstacles = new d(
      () => new g({
        position: { x: 0, y: 0 },
        size: { width: 16, height: 20 },
        type: "bug"
      }),
      10,
      50
    ), this.collectibles = new d(
      () => new b({
        position: { x: 0, y: 0 },
        size: { width: 16, height: 16 },
        points: 10,
        type: "commit"
      }),
      5,
      25
    ), this.setupInputCallbacks();
  }
  /**
   * Initialize the game engine
   */
  initialize() {
    if (typeof window > "u") {
      console.warn("GameEngine: Cannot initialize in SSR environment");
      return;
    }
    this.inputHandler.initialize(), this.audioSystem.initialize(), this.player = new m({
      position: { x: 50, y: this.GROUND_Y - 20 },
      // 20px = player height
      size: { width: 20, height: 20 },
      jumpPower: this.config.jumpPower,
      groundY: this.GROUND_Y - 20
      // Player's ground reference is their feet position
    }), console.log("GameEngine: Initialized successfully");
  }
  /**
   * Start the game
   */
  start() {
    this.state.isRunning || (this.state.isRunning = !0, this.state.isPaused = !1, this.state.score = 0, this.state.gameSpeed = this.config.gameSpeed, this.state.frameCount = 0, this.resetGame(), this.lastTime = performance.now(), this.gameLoop(this.lastTime), this.audioSystem.resume(), this.emitEvent({ type: "gamestart", timestamp: Date.now() }));
  }
  /**
   * Pause the game
   */
  pause() {
    this.state.isRunning && (this.state.isPaused = !this.state.isPaused, this.emitEvent({ type: "pause", timestamp: Date.now() }));
  }
  /**
   * Reset the game
   */
  reset() {
    this.state.score = 0, this.state.gameSpeed = this.config.gameSpeed, this.state.frameCount = 0, this.resetGame(), this.emitEvent({ type: "reset", timestamp: Date.now() });
  }
  /**
   * Restart the game - reset and start playing
   */
  restart() {
    this.state.isRunning && this.stop(), this.reset(), this.start();
  }
  /**
   * Stop the game
   */
  stop() {
    this.state.isRunning = !1, this.state.isPaused = !1, this.animationId && (cancelAnimationFrame(this.animationId), this.animationId = null), this.updateHighScore(), this.emitEvent({ type: "gameover", timestamp: Date.now() });
  }
  /**
   * Destroy the game engine
   */
  destroy() {
    this.stop(), this.inputHandler.destroy(), this.audioSystem.destroy(), this.obstacles.clear(), this.collectibles.clear(), this.particles = [], this.eventListeners.clear();
  }
  /**
   * Main game loop
   */
  gameLoop(t) {
    if (!this.state.isRunning) return;
    const e = t - this.lastTime;
    for (this.lastTime = t, this.accumulator += e; this.accumulator >= this.fixedTimeStep; )
      this.state.isPaused || this.update(this.fixedTimeStep), this.accumulator -= this.fixedTimeStep;
    const i = this.accumulator / this.fixedTimeStep;
    this.render(i), this.animationId = requestAnimationFrame((s) => this.gameLoop(s));
  }
  /**
   * Update game logic
   */
  update(t) {
    this.player && (this.state.frameCount++, this.handlePlayerInput(), this.player.update(t, this.state.gameSpeed), this.spawnEntities(), this.obstacles.updateAll(t, this.state.gameSpeed), this.collectibles.updateAll(t, this.state.gameSpeed), this.updateParticles(t), this.checkCollisions(), this.obstacles.cleanupOffScreen(this.config.width, this.config.height), this.collectibles.cleanupOffScreen(this.config.width, this.config.height), this.increaseDifficulty());
  }
  /**
   * Render the game
   */
  render(t) {
    this.renderSystem.beginFrame(), this.renderSystem.drawBackground(this.state.frameCount), this.renderSystem.drawGround(this.GROUND_Y), this.player && this.renderSystem.renderEntity(this.player), this.renderSystem.renderEntities(this.obstacles.getActive()), this.renderSystem.renderEntities(this.collectibles.getActive()), this.renderSystem.drawParticles(this.particles), this.renderSystem.drawScore(this.state.score), this.renderSystem.drawFPS(1e3 / this.fixedTimeStep), this.state.isPaused && this.renderSystem.drawPause(), !this.state.isRunning && this.player && this.renderSystem.drawGameOver(this.state.score), this.renderSystem.endFrame();
  }
  /**
   * Handle player input
   */
  handlePlayerInput() {
    if (!this.player) return;
    const t = this.inputHandler.getInputState();
    t.left ? this.player.moveLeft() : t.right ? this.player.moveRight() : this.player.stopHorizontalMovement(), t.space && this.player.canJump() && (this.player.jump(), this.audioSystem.playJump(), this.createJumpParticles()), t.pause && this.pause();
  }
  /**
   * Spawn new entities
   */
  spawnEntities() {
    if (Math.random() < this.config.spawnRate) {
      const t = this.obstacles.acquire(), e = Math.random() > 0.5 ? "bug" : "error", i = {
        position: { x: this.config.width, y: this.GROUND_Y - 20 }
      };
      t.setSpawnPosition(i.position.x, i.position.y), t.obstacleType = e;
    }
    if (Math.random() < this.config.spawnRate * 0.5) {
      const t = this.collectibles.acquire(), e = Math.random() > 0.5 ? "commit" : "star", i = {
        position: {
          x: this.config.width,
          y: this.config.height - 80 - Math.random() * 40
        },
        points: e === "commit" ? 10 : 25
      };
      t.setSpawnPosition(i.position.x, i.position.y), t.collectibleType = e, t.points = i.points;
    }
  }
  /**
   * Check collisions
   */
  checkCollisions() {
    if (this.player) {
      for (const t of this.obstacles.getActive())
        if (this.physicsSystem.checkCollision(this.player, t)) {
          this.gameOver();
          return;
        }
      for (const t of this.collectibles.getActive())
        this.physicsSystem.checkCollision(this.player, t) && this.collectItem(t);
    }
  }
  /**
   * Handle item collection
   */
  collectItem(t) {
    const e = t.points || 10;
    this.audioSystem.playCollect(), this.createCollectParticles(t.position), this.collectibles.release(t), this.emitEvent({
      type: "collect",
      data: { points: e, position: t.position },
      timestamp: Date.now()
    }), this.addScore(e);
  }
  /**
   * Game over
   */
  gameOver() {
    this.audioSystem.playGameOver(), this.updateHighScore(), this.createGameOverParticles(), this.renderSystem.triggerFlash("#306230", 0.6), this.stop();
  }
  /**
   * Increase game difficulty
   */
  increaseDifficulty() {
    this.state.score > 0 && this.state.score % 50 === 0 && (this.state.gameSpeed = Math.min(this.state.gameSpeed + 0.5, 12));
  }
  /**
   * Create particle effects
   */
  createJumpParticles() {
    if (this.player)
      for (let t = 0; t < 4; t++)
        this.particles.push({
          position: {
            x: this.player.position.x + this.player.size.width / 2,
            y: this.player.position.y + this.player.size.height
          },
          velocity: {
            x: (Math.random() - 0.5) * 4,
            y: Math.random() * -2
          },
          life: 1,
          color: "#8bac0f",
          size: 2
        });
  }
  createCollectParticles(t) {
    for (let e = 0; e < 8; e++) {
      const i = Math.PI * 2 * e / 8;
      this.particles.push({
        position: { ...t },
        velocity: {
          x: Math.cos(i) * 3,
          y: Math.sin(i) * 3
        },
        life: 1,
        color: "#9bbc0f",
        size: 3
      });
    }
  }
  createGameOverParticles() {
    if (this.player)
      for (let t = 0; t < 12; t++)
        this.particles.push({
          position: {
            x: this.player.position.x + this.player.size.width / 2,
            y: this.player.position.y + this.player.size.height / 2
          },
          velocity: {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
          },
          life: 1,
          color: "#306230",
          size: 4
        });
  }
  /**
   * Update particles
   */
  updateParticles(t) {
    for (let e = this.particles.length - 1; e >= 0; e--) {
      const i = this.particles[e];
      i.position.x += i.velocity.x, i.position.y += i.velocity.y, i.velocity.y += 0.2, i.life -= t / 1e3, i.life <= 0 && this.particles.splice(e, 1);
    }
  }
  /**
   * Reset game state
   */
  resetGame() {
    this.player && this.player.reset(), this.obstacles.releaseAll(), this.collectibles.releaseAll(), this.particles = [], this.inputHandler.reset();
  }
  /**
   * Setup input callbacks
   */
  setupInputCallbacks() {
    this.inputHandler.onCallback("jump", () => {
    }), this.inputHandler.onCallback("pause", () => {
    });
  }
  /**
   * Emit game event
   */
  emitEvent(t) {
    const e = this.eventListeners.get(t.type);
    e && e.forEach((i) => {
      try {
        i(t);
      } catch (s) {
        console.error("GameEngine: Error in event listener:", s);
      }
    });
  }
  /**
   * Update high score in localStorage
   */
  updateHighScore() {
    if (!(typeof window > "u"))
      try {
        const t = this.getHighScore();
        this.state.score > t && localStorage.setItem(this.highScoreKey, this.state.score.toString());
      } catch (t) {
        console.warn("GameEngine: Failed to update high score:", t);
      }
  }
  /**
   * Public API methods
   */
  getScore() {
    return this.state.score;
  }
  getHighScore() {
    if (typeof window > "u") return 0;
    try {
      const t = localStorage.getItem(this.highScoreKey);
      return t ? parseInt(t, 10) : 0;
    } catch (t) {
      return console.warn("GameEngine: Failed to read high score:", t), 0;
    }
  }
  resetHighScore() {
    if (!(typeof window > "u"))
      try {
        localStorage.removeItem(this.highScoreKey);
      } catch (t) {
        console.warn("GameEngine: Failed to reset high score:", t);
      }
  }
  setScoreChangeCallback(t) {
    this.onScoreChangeCallback = t;
  }
  getAudioSystem() {
    return this.audioSystem;
  }
  isPlaying() {
    return this.state.isRunning && !this.state.isPaused;
  }
  isPaused() {
    return this.state.isPaused;
  }
  getGameState() {
    return { ...this.state };
  }
  addEventListener(t, e) {
    this.eventListeners.has(t) || this.eventListeners.set(t, []), this.eventListeners.get(t).push(e);
  }
  removeEventListener(t, e) {
    const i = this.eventListeners.get(t);
    if (i) {
      const s = i.indexOf(e);
      s > -1 && i.splice(s, 1);
    }
  }
  setGameSpeed(t) {
    this.state.gameSpeed = Math.max(1, Math.min(t, 20));
  }
  setScore(t) {
    this.state.score = Math.max(0, t), this.notifyScoreChange();
  }
  /**
   * Add points to current score (atomic operation)
   */
  addScore(t) {
    this.state.score = Math.max(0, this.state.score + t), this.notifyScoreChange();
  }
  /**
   * Notify about score changes (single synchronized method)
   */
  notifyScoreChange() {
    this.onScoreChangeCallback && this.onScoreChangeCallback(this.state.score), this.emitEvent({
      type: "score",
      data: { score: this.state.score },
      timestamp: Date.now()
    });
  }
}
export {
  R as GameEngine
};
