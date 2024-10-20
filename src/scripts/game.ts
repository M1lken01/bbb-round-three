const gameElem = document.querySelector('canvas#game') as HTMLCanvasElement;
const ctx = gameElem.getContext('2d') as CanvasRenderingContext2D;

type SimpleVec2 = { x: number; y: number };
class Vec2 {
  private v: SimpleVec2;

  constructor(x: number = 0, y: number = 0) {
    this.v = { x, y };
  }

  getX() {
    return fixedCoords(this.v).x;
  }

  getY() {
    return fixedCoords(this.v).y;
  }

  get() {
    return fixedCoords(this.v);
  }

  getZoomCorrected() {
    return fixedCoords({ x: this.v.x * zoom, y: this.v.y * zoom });
  }
}

gameElem.width = 1600;
gameElem.height = 900;

let objects: Factory[] = [];

let zoom = 2;
const mapWidth = () => 1600 * zoom;
const mapHeight = () => 900 * zoom;

let panX = (gameElem.width - mapWidth()) / 2;
let panY = (gameElem.height - mapHeight()) / 2;

let isDragging = false;
let startX = 0;
let startY = 0;

const fixedCoords = (v: SimpleVec2): SimpleVec2 => ({ x: v.x + mapWidth() / 2, y: mapHeight() / 2 - v.y });

class City {
  private batteryType = 0;
}

class Factory {
  private batteryType = 0;
  private color = 'red';
  private position = new Vec2(100, -200);
  private size = 20;
  private range = 100;

  public draw() {
    const pos = this.position.getZoomCorrected();
    const halfSize = (this.size / 2) * zoom;
    const size = this.size * zoom;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.fillRect(pos.x - halfSize, pos.y - halfSize, size, size);
    ctx.beginPath();
    ctx.moveTo(pos.x - halfSize, pos.y - halfSize);
    ctx.lineTo(pos.x, pos.y - size);
    ctx.lineTo(pos.x - halfSize + size, pos.y - halfSize);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.range * zoom, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  }
}
objects.push(new Factory());

function draw() {
  ctx.clearRect(0, 0, gameElem.width, gameElem.height);

  // Draw white background for the map area
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, gameElem.width, gameElem.height);

  // Apply pan transformation
  ctx.save();
  ctx.translate(panX, panY);

  // Draw the map boundaries (to visualize the edges of the map)
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, mapWidth(), mapHeight());

  objects.forEach((obj) => obj.draw());

  ctx.lineWidth = 1;
  const center = new Vec2();
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(center.getX(), center.getY() + mapHeight() / 2);
  ctx.lineTo(center.getX(), center.getY() - mapHeight() / 2);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(center.getX() + mapWidth() / 2, center.getY());
  ctx.lineTo(center.getX() - mapWidth() / 2, center.getY());
  ctx.closePath();
  ctx.stroke();
  //console.log(center.get(), panX, panY);
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.arc(center.getX(), center.getY(), 20 * zoom, 0, Math.PI * 2);
  ctx.closePath();
  ctx.stroke();

  // Restore context state
  ctx.restore();
}

gameElem.addEventListener('wheel', (event) => {
  event.preventDefault();

  // Store the old zoom level
  const oldZoom = zoom;

  // Calculate new zoom level (limit between 1 and 5)
  zoom = Math.max(1, Math.min(5, Math.round((zoom - Math.sign(event.deltaY) * 0.25) * 4) / 4));

  // Get mouse position relative to the canvas
  const mouseX = event.clientX - gameElem.getBoundingClientRect().left;
  const mouseY = event.clientY - gameElem.getBoundingClientRect().top;

  // Calculate the position of the mouse relative to the map (before zoom)
  const relX = (mouseX - panX) / oldZoom;
  const relY = (mouseY - panY) / oldZoom;

  // Adjust pan based on new zoom (to zoom towards the mouse)
  panX = mouseX - relX * zoom;
  panY = mouseY - relY * zoom;

  // Clamp pan values so the map doesn't go out of bounds
  panX = Math.min(0, Math.max(gameElem.width - mapWidth(), panX));
  panY = Math.min(0, Math.max(gameElem.height - mapHeight(), panY));

  console.log({ zoom, panX, panY });

  draw();
});

// Handle dragging for panning the map
gameElem.addEventListener('mousedown', (event: MouseEvent) => {
  isDragging = true;
  startX = event.clientX - panX;
  startY = event.clientY - panY;
});

gameElem.addEventListener('mousemove', (event: MouseEvent) => {
  if (isDragging) {
    const newPanX = event.clientX - startX;
    const newPanY = event.clientY - startY;
    panX = Math.min(0, Math.max(gameElem.width - mapWidth(), newPanX));
    panY = Math.min(0, Math.max(gameElem.height - mapHeight(), newPanY));
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
