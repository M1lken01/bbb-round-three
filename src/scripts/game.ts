const gameElem = document.querySelector('canvas#game') as HTMLCanvasElement;
const ctx = gameElem.getContext('2d') as CanvasRenderingContext2D;

type ShortVec2 = { x: number; y: number };
class Vec2 {
  private v: ShortVec2;

  constructor(x: number = 0, y: number = 0) {
    this.v = { x, y };
  }

  get value(): ShortVec2 {
    return this.v;
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

  getMultiplied(scalar: number, vector = this.get()) {
    return { x: vector.x * scalar, y: vector.y * scalar };
  }

  getCanvasCorrected(): ShortVec2 {
    return canvasCorrect(this.v);
  }

  getZoomCorrected(): ShortVec2 {
    return canvasCorrect(this.getMultiplied(zoom));
  }

  getAntiZoomCorrected(): ShortVec2 {
    return this.getMultiplied(zoom, reverseCanvasCorrect(this.get()));
  }

  getDistanceFrom(other: Vec2) {
    return Math.sqrt((other.getX() - this.v.x) ** 2 + (other.getY() - this.v.y) ** 2);
  }
}

gameElem.width = 1600;
gameElem.height = 900;

let cities: City[] = [];
let factories: Factory[] = [];
type battery = 0 | 1 | 2;
const batteryColors = ['red', 'blue', 'yellow'];
let selectedBattery: battery = 0;

let zoom = 1;
const mapWidth = () => 1600 * zoom;
const mapHeight = () => 900 * zoom;

let panX = (gameElem.width - mapWidth()) / 2;
let panY = (gameElem.height - mapHeight()) / 2;

let isDragging = false;
let startX = 0;
let startY = 0;

let mouseClick = new Vec2().get();
let mouseClick2 = new Vec2().get();

const canvasCorrect = (v: ShortVec2): ShortVec2 => ({ x: v.x + mapWidth() / 2, y: mapHeight() / 2 - v.y });
const reverseCanvasCorrect = (v: ShortVec2): ShortVec2 => ({ x: v.x - mapWidth() / 2, y: mapHeight() / 2 - v.y });

class City {
  private batteryType: battery;
  private position: Vec2;
  private size = 20;
  private range = 100;

  constructor(batteryType: battery, position: Vec2 = new Vec2(), color: string = '#000') {
    this.batteryType = batteryType;
    this.position = position;
  }

  public draw() {
    const pos = this.position.getZoomCorrected();
    console.log({ actual: this.position.get(), drawing: pos });
    const halfSize = (this.size / 2) * zoom;
    const size = this.size * zoom;
    ctx.fillStyle = batteryColors[this.batteryType];
    ctx.fillRect(pos.x - halfSize, pos.y - halfSize, size, size);
    ctx.beginPath();
    ctx.moveTo(pos.x - halfSize, pos.y - halfSize);
    ctx.lineTo(pos.x, pos.y - size);
    ctx.lineTo(pos.x - halfSize + size, pos.y - halfSize);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5 * zoom, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  }

  public getBatteryType(): number {
    return this.batteryType;
  }

  public getPosition(): Vec2 {
    return this.position;
  }
}

class Factory {
  private batteryType: battery;
  private position: Vec2;
  private size = 20;
  private range = 100;

  constructor(batteryType: battery, position: Vec2 = new Vec2()) {
    this.batteryType = batteryType;
    this.position = position;
  }

  public draw() {
    const pos = this.position.getZoomCorrected();
    const quarterSize = (this.size / 4) * zoom;
    const halfSize = (this.size / 2) * zoom;
    const size = this.size * zoom;
    ctx.fillStyle = batteryColors[this.batteryType];
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
    ctx.strokeStyle = batteryColors[this.batteryType];
    ctx.lineWidth = 1;
    cities.forEach((city) => {
      if (city.getBatteryType() === this.batteryType && this.position.getDistanceFrom(city.getPosition()) <= this.range) {
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
    ctx.strokeStyle = batteryColors[this.batteryType];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.range * zoom, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  }
}

class Circle {
  private position: Vec2;
  private color: string;

  constructor(position: Vec2 = new Vec2(), color: string = '#000') {
    this.position = position;
    this.color = color;
  }

  public draw() {
    const pos = this.position.get();
    const size = 5 * zoom;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  }
}

/*factories.push(new Factory(0, new Vec2(25, 0), 'red'));
factories.push(new Factory(1, new Vec2(-25, 0), 'blue'));*/
cities.push(new City(0, new Vec2(-300, 100), 'red'));
cities.push(new City(1, new Vec2(0, -300), 'blue'));
cities.push(new City(2, new Vec2(300, 100), 'yellow'));

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

  factories.forEach((obj) => obj.draw());
  cities.forEach((obj) => obj.draw());

  new Circle(new Vec2(mouseClick2.x, mouseClick2.y), 'blue').draw();
  const mc = new Vec2(mouseClick.x, mouseClick.y).getZoomCorrected();
  new Circle(new Vec2(mc.x, mc.y), 'red').draw();
  console.log({
    blue: mouseClick2,
    red: mc,
    blueReversed: reverseCanvasCorrect(mouseClick2),
    redReversed: new Vec2(mouseClick.x, mouseClick.y).getZoomCorrected(),
    blueOriginal: canvasCorrect(reverseCanvasCorrect(mouseClick2)),
    redOriginal: new Vec2(mouseClick.x, mouseClick.y).get(),
  });

  // Restore context state
  ctx.restore();
}
// !disabled zoom while its being fixed
/*
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
});*/

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

gameElem.addEventListener('click', (event) => {
  const mouseX = event.clientX - gameElem.getBoundingClientRect().left;
  const mouseY = event.clientY - gameElem.getBoundingClientRect().top;
  const sv = { x: (mouseX / zoom - panX / zoom) * zoom, y: (mouseY / zoom - panY / zoom) * zoom };
  console.log({ mouseX, mouseY, panX, panY });
  mouseClick = reverseCanvasCorrect(new Vec2(sv.x, sv.y).get());
  mouseClick2 = sv;
  console.log(mouseClick, reverseCanvasCorrect(mouseClick));
  factories.push(new Factory(selectedBattery, new Vec2(mouseClick.x, mouseClick.y)));
  draw();
});

draw();
