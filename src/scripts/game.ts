const gameElem = document.querySelector('canvas#game') as HTMLCanvasElement;
const ctx = gameElem.getContext('2d') as CanvasRenderingContext2D;

type ShortVec2 = { x: number; y: number };
class Vec2 {
  private v: ShortVec2;

  constructor(x: number = 0, y: number = 0) {
    this.v = { x, y };
  }

  getX() {
    return this.v.x;
  }

  getY() {
    return this.v.y;
  }

  get() {
    return this.v;
  }

  getCanvasCorrected() {
    return canvasCorrect(this.v);
  }

  getZoomCorrected() {
    return canvasCorrect({ x: this.v.x * zoom, y: this.v.y * zoom });
  }

  getDistanceFrom(other: Vec2) {
    return Math.sqrt((other.getX() - this.v.x) ** 2 + (other.getY() - this.v.y) ** 2);
  }
}

gameElem.width = 1600;
gameElem.height = 900;

let cities: City[] = [];
let factories: Factory[] = [];

let zoom = 2;
const mapWidth = () => 1600 * zoom;
const mapHeight = () => 900 * zoom;

let panX = (gameElem.width - mapWidth()) / 2;
let panY = (gameElem.height - mapHeight()) / 2;

let isDragging = false;
let startX = 0;
let startY = 0;

const canvasCorrect = (v: ShortVec2): ShortVec2 => ({ x: v.x + mapWidth() / 2, y: mapHeight() / 2 - v.y });

class City {
  private batteryType = 0;
  private position: Vec2;
  private color: string;
  private size = 20;
  private range = 100;

  constructor(position: Vec2 = new Vec2(), color: string = '#000') {
    this.position = position;
    this.color = color;
  }

  public draw() {
    const pos = this.position.getZoomCorrected();
    const halfSize = (this.size / 2) * zoom;
    const size = this.size * zoom;
    console.log(this.position.getDistanceFrom(new Vec2()));
    ctx.fillStyle = this.color;
    ctx.fillRect(pos.x - halfSize, pos.y - halfSize, size, size);
    ctx.beginPath();
    ctx.moveTo(pos.x - halfSize, pos.y - halfSize);
    ctx.lineTo(pos.x, pos.y - size);
    ctx.lineTo(pos.x - halfSize + size, pos.y - halfSize);
    ctx.closePath();
    ctx.fill();
  }

  public getBatteryType(): number {
    return this.batteryType;
  }

  public getPosition(): Vec2 {
    return this.position;
  }
}

class Factory {
  private batteryType = 0;
  private position: Vec2;
  private color: string;
  private size = 20;
  private range = 100;

  constructor(position: Vec2 = new Vec2(), color: string = '#000') {
    this.position = position;
    this.color = color;
  }

  public draw() {
    const pos = this.position.getZoomCorrected();
    const quarterSize = (this.size / 4) * zoom;
    const halfSize = (this.size / 2) * zoom;
    const size = this.size * zoom;
    console.log(this.position.getDistanceFrom(new Vec2()));
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.fillStyle = this.color;
    ctx.fillRect(pos.x - halfSize, pos.y, size, size / 2);
    ctx.beginPath();
    ctx.moveTo(pos.x - halfSize, pos.y); // top left
    ctx.lineTo(pos.x - halfSize, pos.y - halfSize);
    ctx.lineTo(pos.x - quarterSize, pos.y - halfSize);
    ctx.lineTo(pos.x - quarterSize, pos.y);
    ctx.lineTo(pos.x, pos.y - quarterSize);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineTo(pos.x + quarterSize, pos.y - quarterSize);
    ctx.lineTo(pos.x + quarterSize, pos.y);
    ctx.lineTo(pos.x + halfSize, pos.y - quarterSize);
    ctx.lineTo(pos.x + halfSize, pos.y);
    ctx.closePath();
    ctx.fill();
    cities.forEach((city) => {
      console.log({ cityPos: city.getPosition() });
      if (city.getBatteryType() === this.batteryType && this.position.getDistanceFrom(city.getPosition()) <= this.range) {
        console.log('city in range');
        const cityPos = city.getPosition().getZoomCorrected();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(cityPos.x, cityPos.y);
        ctx.closePath();
        ctx.stroke();
      }
    });
  }

  public drawRing() {
    const pos = this.position.getZoomCorrected();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.range * zoom, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  }
}
factories.push(new Factory(new Vec2(25, 0), 'red'));
factories.push(new Factory(new Vec2(-25, 0), 'blue'));
cities.push(new City(new Vec2(0, 25), 'yellow'));

function draw() {
  ctx.clearRect(0, 0, gameElem.width, gameElem.height);
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, gameElem.width, gameElem.height);
  ctx.save();
  ctx.translate(panX, panY);

  // Draw the map boundaries (to visualize the edges of the map)
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, mapWidth(), mapHeight());

  ctx.lineWidth = 1;
  const center = new Vec2().getCanvasCorrected();
  ctx.beginPath();
  ctx.moveTo(center.x, center.y + mapHeight() / 2);
  ctx.lineTo(center.x, center.y - mapHeight() / 2);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(center.x + mapWidth() / 2, center.y);
  ctx.lineTo(center.x - mapWidth() / 2, center.y);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(center.x, center.y, 10 * zoom, 0, Math.PI * 2);
  ctx.closePath();
  ctx.stroke();

  cities.forEach((obj) => obj.draw());
  factories.forEach((obj) => obj.draw());

  // Restore context state
  ctx.restore();
}

gameElem.addEventListener('wheel', (event) => {
  event.preventDefault();
  const oldZoom = zoom;
  zoom = Math.max(1, Math.min(5, Math.round((zoom - Math.sign(event.deltaY) * 0.25) * 4) / 4));
  const mouseX = event.clientX - gameElem.getBoundingClientRect().left;
  const mouseY = event.clientY - gameElem.getBoundingClientRect().top;
  panX = Math.min(0, Math.max(gameElem.width - mapWidth(), mouseX - ((mouseX - panX) / oldZoom) * zoom));
  panY = Math.min(0, Math.max(gameElem.height - mapHeight(), mouseY - ((mouseY - panY) / oldZoom) * zoom));
  console.log({ zoom, panX, panY });
  draw();
});

gameElem.addEventListener('mousedown', (event: MouseEvent) => {
  isDragging = true;
  startX = event.clientX - panX;
  startY = event.clientY - panY;
});

gameElem.addEventListener('mousemove', (event: MouseEvent) => {
  if (isDragging) {
    panX = Math.min(0, Math.max(gameElem.width - mapWidth(), event.clientX - startX));
    panY = Math.min(0, Math.max(gameElem.height - mapHeight(), event.clientY - startY));
    draw();
  }
});

gameElem.addEventListener('mouseup', () => {
  isDragging = false;
});

gameElem.addEventListener('mouseleave', () => {
  isDragging = false;
});

draw();
