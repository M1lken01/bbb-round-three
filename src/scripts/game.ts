const gameElem = document.querySelector('canvas#game') as HTMLCanvasElement;
const ctx = gameElem.getContext('2d') as CanvasRenderingContext2D;
const buildFactoryButtons = document.querySelectorAll('button.factory-button') as NodeListOf<HTMLButtonElement>;
let game: Game;

type Battery = 0 | 1 | 2;
const batteryColors = ['red', 'blue', 'green'] as const;
type BatteryColor = (typeof batteryColors)[number];

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
    return new Vec2(vector.x * scalar, vector.y * scalar);
  }

  getZoomCorrected() {
    return this.getMultiplied(game.getZoom());
  }

  getDistanceFrom(other: Vec2) {
    return Math.sqrt((other.getX() - this.v.x) ** 2 + (other.getY() - this.v.y) ** 2);
  }
}

class Game {
  private cities: City[] = [];
  private factories: Factory[] = [];
  private selectedFactory: Battery | -1 = -1;
  public mousePos = new Vec2();
  private mapSize: Vec2;
  private zoom = 1;
  private pan: Vec2;
  private isDragging = false;
  private dragStart = new Vec2();

  constructor(mapSize: Vec2) {
    this.mapSize = mapSize;
    this.pan = new Vec2((this.mapSize.getX() - this.getMapWidth()) / 2, (this.mapSize.getY() - this.getMapHeight()) / 2);
    //! move to quests
    this.addCity(new City(0, new Vec2(400, 300)));
    this.addCity(new City(1, new Vec2(800, 600)));
    this.addCity(new City(2, new Vec2(1200, 300)));
  }

  render() {
    const [w, h] = [this.getMapWidth(), this.getMapHeight()];
    ctx.clearRect(0, 0, gameElem.width, gameElem.height);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, gameElem.width, gameElem.height);
    ctx.save();
    ctx.translate(this.pan.getX(), this.pan.getY());
    ctx.strokeStyle = '#efefef';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, w, h);
    ctx.lineWidth = 1;
    const center = new Vec2(w / 2, h / 2).get();
    ctx.beginPath();
    ctx.moveTo(center.x, center.y + h / 2);
    ctx.lineTo(center.x, center.y - h / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(center.x + w / 2, center.y);
    ctx.lineTo(center.x - w / 2, center.y);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(center.x, center.y, 10 * this.zoom, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();

    if (!this.isDragging && this.selectedFactory !== -1) {
      new Circle(this.mousePos.getZoomCorrected(), 100 * this.zoom, '#bbb').draw();
      this.getCitiesInRange(this.mousePos, 100, this.selectedFactory).forEach((city) => {
        new Circle(city.getPosition().getZoomCorrected(), 15 * this.zoom, '#bbb', true).draw();
      });
    }

    this.factories.forEach((obj) => obj.draw());
    this.cities.forEach((obj) => obj.draw());

    ctx.restore();
  }

  handleMouse(event: MouseEvent) {
    this.mousePos = this.getCorrectPos(this.getPosFromMouse(event));
  }

  handleScroll(event: WheelEvent) {
    event.preventDefault();
    this.handleMouse(event);
    const oldZoom = this.zoom;
    this.zoom = Math.max(1, Math.min(5, Math.round((this.zoom - Math.sign(event.deltaY) * 0.25) * 4) / 4));
    const mouse = this.getPosFromMouse(event);
    this.setPan(
      new Vec2(
        mouse.getX() - ((mouse.getX() - this.pan.getX()) / oldZoom) * this.zoom,
        mouse.getY() - ((mouse.getY() - this.pan.getY()) / oldZoom) * this.zoom,
      ),
    );
    this.render();
  }

  handleClick(event: MouseEvent) {
    this.handleMouse(event);
    if (this.selectedFactory !== -1) {
      // ! add a check if a city or another factory is too close
      this.factories.push(new Factory(this.selectedFactory, this.mousePos));
      this.selectedFactory = -1;
    }
    this.render();
    updateUI();
  }

  handleMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.dragStart = new Vec2(event.clientX - this.pan.getX(), event.clientY - this.pan.getY());
  }

  handleMouseMove(event: MouseEvent) {
    this.handleMouse(event);
    if (this.isDragging) this.setPan(new Vec2(event.clientX - this.dragStart.getX(), event.clientY - this.dragStart.getY()));
    this.render();
  }

  stopDragging() {
    this.isDragging = false;
  }

  private getPosFromMouse(event: MouseEvent) {
    return new Vec2(event.clientX - gameElem.getBoundingClientRect().left, event.clientY - gameElem.getBoundingClientRect().top);
  }

  private getCorrectPos(vector: Vec2) {
    return new Vec2((vector.getX() - this.pan.getX()) / this.zoom, (vector.getY() - this.pan.getY()) / this.zoom);
  }

  private setPan(vector: Vec2) {
    this.pan = new Vec2(
      Math.min(0, Math.max(gameElem.width - this.getMapWidth(), vector.getX())),
      Math.min(0, Math.max(gameElem.height - this.getMapHeight(), vector.getY())),
    );
  }

  getMapSize() {
    return this.mapSize;
  }

  getZoom() {
    return this.zoom;
  }

  getPan() {
    return this.pan;
  }

  getMapWidth() {
    return this.mapSize.getX() * this.zoom;
  }

  getMapHeight() {
    return this.mapSize.getY() * this.zoom;
  }

  getCities() {
    return this.cities;
  }

  addCity(city: City) {
    this.cities.push(city);
  }

  getFactories() {
    return this.factories;
  }

  getSelectedFactory() {
    return this.selectedFactory;
  }

  setSelectedFactory(value: Battery) {
    this.selectedFactory = value === game.selectedFactory ? -1 : value;
  }

  getCitiesInRange(vector: Vec2, range: number, type: Battery) {
    return game.getCities().filter((city) => city.getBatteryType() === type && vector.getDistanceFrom(city.getPosition()) <= range);
  }
}

type ImageCollection = {
  [key in BatteryColor]: HTMLImageElement | undefined;
};
const resources: {
  factories: ImageCollection;
  cities: ImageCollection;
} = {
  factories: {
    red: undefined,
    blue: undefined,
    green: undefined,
  },
  cities: {
    red: undefined,
    blue: undefined,
    green: undefined,
  },
};

class City {
  private batteryType: Battery;
  private position: Vec2;
  private size = 25;

  constructor(batteryType: Battery, position: Vec2 = new Vec2()) {
    this.batteryType = batteryType;
    this.position = position;
  }

  public draw() {
    const pos = this.position.getZoomCorrected().get();
    const halfSize = (this.size / 2) * game.getZoom();
    const size = this.size * game.getZoom();
    ctx.drawImage(resources.cities[batteryColors[this.batteryType]] as HTMLImageElement, pos.x - halfSize, pos.y - halfSize, size, size);
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5 * game.getZoom(), 0, Math.PI * 2);
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
  private batteryType: Battery;
  private position: Vec2;
  private size = 25;
  private range = 100;

  constructor(batteryType: Battery, position: Vec2 = new Vec2()) {
    this.batteryType = batteryType;
    this.position = position;
  }

  public draw() {
    const pos = this.position.getZoomCorrected().get();
    const halfSize = (this.size / 2) * game.getZoom();
    const size = this.size * game.getZoom();
    game.getCities().forEach((city) => {
      if (city.getBatteryType() === this.batteryType && this.position.getDistanceFrom(city.getPosition()) <= this.range) {
        ctx.beginPath();
        ctx.strokeStyle = batteryColors[this.batteryType];
        ctx.lineWidth = 1;
        const cityPos = city.getPosition().getZoomCorrected().get();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(cityPos.x, cityPos.y);
        ctx.closePath();
        ctx.stroke();
      }
    });
    ctx.drawImage(resources.factories[batteryColors[this.batteryType]] as HTMLImageElement, pos.x - halfSize, pos.y - halfSize, size, size);
  }

  public drawRing() {
    const pos = this.position.getZoomCorrected().get();
    ctx.strokeStyle = batteryColors[this.batteryType];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.range * game.getZoom(), 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  }
}

class Circle {
  private position: Vec2;
  private radius: number;
  private color: string | CanvasGradient;
  private filled: boolean;

  constructor(position: Vec2 = new Vec2(), radius: number = 5, color: string | CanvasGradient = '#000', filled: boolean = false) {
    this.position = position;
    this.radius = radius;
    this.color = color;
    this.filled = filled;
  }

  public draw() {
    const pos = this.position.get();
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    if (this.filled) ctx.fill();
    else ctx.stroke();
  }
}

async function loadResources() {
  batteryColors.forEach(async (color) => {
    const factoryImg = await getImage(`imgs/assets/factories/${color}.svg`);
    resources.factories[color] = factoryImg;
    const cityImg = await getImage(`imgs/assets/cities/${color}.svg`);
    resources.cities[color] = cityImg;
  });
}

function waitForResources(callback: Function) {
  setTimeout(() => {
    if (Object.values(resources.factories).some((factory) => !factory) || Object.values(resources.cities).some((city) => !city)) waitForResources(callback);
    else callback();
  }, 100);
}

async function getImage(src: string) {
  const img = new Image();
  img.src = `data:image/svg+xml;base64,${btoa(await (await fetch(src)).text())}`;
  return img;
}

function updateUI() {
  buildFactoryButtons.forEach((button) => button.classList.remove('selected'));
  if (game.getSelectedFactory() !== -1) document.querySelector(`button[data-factory="${game.getSelectedFactory()}"]`)!.classList.add('selected');
}

function setupListeners() {
  gameElem.addEventListener('wheel', (event) => game.handleScroll(event));
  gameElem.addEventListener('mousedown', (event: MouseEvent) => game.handleMouseDown(event));
  gameElem.addEventListener('mousemove', (event: MouseEvent) => game.handleMouseMove(event));
  gameElem.addEventListener('mouseup', () => game.stopDragging());
  gameElem.addEventListener('mouseleave', () => game.stopDragging());
  gameElem.addEventListener('click', (event) => game.handleClick(event));
  buildFactoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      game.setSelectedFactory(Number(button.dataset.factory) as Battery);
      updateUI();
    });
  });
}

function init() {
  game = new Game(new Vec2(1600, 900));
  gameElem.width = game.getMapSize().getX();
  gameElem.height = game.getMapSize().getY();
  loadResources();
  waitForResources(() => {
    setupListeners();
    game.render();
  });
}

init();
