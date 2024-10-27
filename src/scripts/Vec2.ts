class Vec2 {
  private x: number;
  private y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }

  get() {
    return { x: this.x, y: this.y };
  }

  toString() {
    return JSON.stringify(this.get());
  }

  getAsTuple(): [number, number] {
    return [this.x, this.y];
  }

  add(value: Vec2 | number): Vec2 {
    value = value instanceof Vec2 ? value : new Vec2(value, value);
    return new Vec2(this.getX() + value.getX(), this.getY() + value.getY());
  }

  subtract(value: Vec2 | number): Vec2 {
    value = value instanceof Vec2 ? value : new Vec2(value, value);
    return new Vec2(this.getX() - value.getX(), this.getY() - value.getY());
  }

  divide(scalar: number) {
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  multiply(scalar: number) {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  getZoomCorrected() {
    return this.multiply(game.getZoom());
  }

  getDistanceFrom(other: Vec2) {
    return Math.sqrt((other.getX() - this.x) ** 2 + (other.getY() - this.y) ** 2);
  }
}
