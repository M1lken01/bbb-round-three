const gameElem = document.querySelector('canvas#game') as HTMLCanvasElement;
const ctx = gameElem.getContext('2d') as CanvasRenderingContext2D;
const buildFactoryButtons = document.querySelectorAll('button.factory-button') as NodeListOf<HTMLButtonElement>;
let game: Game;

type BatteryType = number;
interface BatteryData {
  id: BatteryType;
  name: string;
  color: string;
  factorySrc: string;
  citySrc: string;
  factoryImg?: HTMLImageElement;
  cityImg?: HTMLImageElement;
}

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

class Game {
  private cities: City[] = [];
  private factories: Factory[] = [];
  private selectedFactory?: BatteryType;
  private mousePos = new Vec2();
  private mapSize: Vec2;
  private zoom = 1;
  private pan: Vec2;
  private isDragging = false;
  private dragStart = new Vec2();
  private storage: Record<BatteryType, number> = {
    0: 1,
    1: 1,
    2: 1,
  };

  constructor(mapSize: Vec2) {
    this.mapSize = mapSize;
    this.pan = this.mapSize.subtract(this.getMapAsVector()).divide(2);
    //! move to quests \/
    this.addCity(new City(0, new Vec2(400, 300)));
    this.addCity(new City(1, new Vec2(800, 600)));
    this.addCity(new City(2, new Vec2(1200, 300)));
  }

  render() {
    ctx.clearRect(0, 0, gameElem.width, gameElem.height);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, gameElem.width, gameElem.height);
    ctx.save();
    ctx.translate(this.pan.getX(), this.pan.getY());
    ctx.strokeStyle = '#efefef';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, this.getMapWidth(), this.getMapHeight());
    this.drawGrid();

    if (!this.isDragging && this.selectedFactory !== undefined) {
      new Circle(this.mousePos.getZoomCorrected(), 100 * this.zoom, '#bbb').draw();
      this.getCitiesInRange(this.mousePos, 100, this.selectedFactory).forEach((city) =>
        new Circle(city.getPosition().getZoomCorrected(), 15 * this.zoom, '#eee', true).draw(),
      );
    }

    this.factories.forEach((obj) => obj.draw());
    this.cities.forEach((obj) => obj.draw());
    ctx.restore();
  }

  private drawGrid() {
    const [w, h] = [this.getMapWidth(), this.getMapHeight()];
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
    this.setPan(mouse.subtract(mouse.subtract(this.pan).divide(oldZoom).multiply(this.zoom)));
    this.render();
  }

  handleClick(event: MouseEvent) {
    this.handleMouse(event);
    if (this.selectedFactory !== undefined) {
      this.buildFactory(this.selectedFactory, this.mousePos);
      this.selectedFactory = undefined;
    }
    this.render();
    updateUI();
  }

  handleMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.dragStart = new Vec2(event.clientX, event.clientY).subtract(this.pan);
  }

  handleMouseMove(event: MouseEvent) {
    this.handleMouse(event);
    if (this.isDragging) this.setPan(new Vec2(event.clientX, event.clientY).subtract(this.dragStart));
    this.render();
  }

  stopDragging() {
    this.isDragging = false;
  }

  private getPosFromMouse(event: MouseEvent) {
    const bounds = gameElem.getBoundingClientRect();
    return new Vec2(event.clientX, event.clientY).subtract(new Vec2(bounds.left, bounds.top));
  }

  private getCorrectPos(vector: Vec2) {
    return vector.subtract(this.pan).divide(this.zoom);
  }

  private setPan(vector: Vec2) {
    this.pan = new Vec2(
      Math.min(0, Math.max(gameElem.width - this.getMapWidth(), vector.getX())),
      Math.min(0, Math.max(gameElem.height - this.getMapHeight(), vector.getY())),
    );
  }

  buildFactory(battery: BatteryType, location: Vec2) {
    if (this.storage[battery] > 0) {
      // ! add a check if a city or another factory is too close
      this.factories.push(new Factory(battery, location));
      this.storage[battery]--;
    }
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

  getMapAsVector() {
    return this.mapSize.multiply(this.zoom);
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

  setSelectedFactory(value: BatteryType) {
    this.selectedFactory = value === game.selectedFactory ? undefined : value;
  }

  getCitiesInRange(vector: Vec2, range: number, type: BatteryType) {
    return game.getCities().filter((city) => city.getBatteryType() === type && vector.getDistanceFrom(city.getPosition()) <= range);
  }

  getStorage() {
    return this.storage;
  }
}

class City {
  private batteryType: BatteryType;
  private position: Vec2;
  private size = 25;
  private isSupplied: boolean = false;

  constructor(batteryType: BatteryType, position: Vec2 = new Vec2()) {
    this.batteryType = batteryType;
    this.position = position;
  }

  public draw() {
    const size = this.size * game.getZoom();
    ctx.drawImage(
      getBatteryDataById(this.batteryType).cityImg ?? toImage(getBatteryDataById(this.batteryType).citySrc),
      ...this.position
        .getZoomCorrected()
        .subtract(size / 2)
        .getAsTuple(),
      size,
      size,
    );
  }

  public getBatteryType(): BatteryType {
    return this.batteryType;
  }

  public getPosition(): Vec2 {
    return this.position;
  }
}

class Factory {
  private batteryType: BatteryType;
  private position: Vec2;
  private size = 25;
  private range = 100;

  constructor(batteryType: BatteryType, position: Vec2 = new Vec2()) {
    this.batteryType = batteryType;
    this.position = position;
  }

  public draw() {
    const size = this.size * game.getZoom();
    const battery = getBatteryDataById(this.batteryType);
    ctx.strokeStyle = battery.color;
    ctx.lineWidth = 2;
    game.getCities().forEach((city) => {
      if (city.getBatteryType() === this.batteryType && this.position.getDistanceFrom(city.getPosition()) <= this.range) {
        ctx.beginPath();
        ctx.moveTo(...this.position.getZoomCorrected().getAsTuple());
        ctx.lineTo(...city.getPosition().getZoomCorrected().getAsTuple());
        ctx.closePath();
        ctx.stroke();
      }
    });
    ctx.drawImage(
      battery.factoryImg ?? toImage(battery.factorySrc),
      ...this.position
        .getZoomCorrected()
        .subtract(size / 2)
        .getAsTuple(),
      size,
      size,
    );
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
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.arc(...this.position.getAsTuple(), this.radius, 0, Math.PI * 2);
    ctx.closePath();
    if (this.filled) ctx.fill();
    else ctx.stroke();
  }
}

function loadResources() {
  batteryData.map((battery) => {
    battery.factoryImg = toImage(battery.factorySrc);
    battery.cityImg = toImage(battery.citySrc);
  });
}

//! this function only has to be used when there are resource changes
async function bakeResources() {
  await Promise.all(
    batteryData.map(async (battery) => {
      battery.factorySrc = await fetchImageData(`imgs/assets/factories/${battery.name}.svg`);
      battery.citySrc = await fetchImageData(`imgs/assets/cities/${battery.name}.svg`);
    }),
  );
}

function toImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

async function fetchImageData(src: string) {
  return `data:image/svg+xml;base64,${btoa(await (await fetch(src)).text())}`;
}

function updateUI() {
  buildFactoryButtons.forEach((button) => {
    button.classList.remove('selected');
    const inStorageCount = game.getStorage()[getBatteryDataById(Number(button.dataset.factory)).id];
    button.querySelectorAll('span')[1].innerText = inStorageCount.toString();
    if (inStorageCount === 0) button.disabled = true;
  });
  if (game.getSelectedFactory() !== undefined) document.querySelector(`button[data-factory="${game.getSelectedFactory()}"]`)!.classList.add('selected');
}

function getBatteryDataById(id: BatteryType) {
  return batteryData.find((battery) => battery.id === id)!;
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
      game.setSelectedFactory(getBatteryDataById(Number(button.dataset.factory)).id);
      updateUI();
    });
  });
}

async function init() {
  game = new Game(new Vec2(1600, 900));
  gameElem.width = game.getMapSize().getX();
  gameElem.height = game.getMapSize().getY();
  loadResources();
  setupListeners();
  game.render();
}

init();
