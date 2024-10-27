const gameElem = document.querySelector('canvas#game') as HTMLCanvasElement;
const ctx = gameElem.getContext('2d') as CanvasRenderingContext2D;
const buildFactoryButtons = document.querySelectorAll('button.factory-button') as NodeListOf<HTMLButtonElement>;
const taskInfoDiv = document.querySelector('div#task') as HTMLDivElement;
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

type Task = { title: string; description: string; cities: City[] };
const tasks: Task[] = [
  { title: 'tutorial', description: 'lorem', cities: [new City(0, new Vec2(373, 296)), new City(1, new Vec2(768, 469)), new City(2, new Vec2(1231, 372))] },
];
const selectedTask = 0;

function drawCircle(position: Vec2 = new Vec2(), radius: number = 5, color: string | CanvasGradient = '#000', filled: boolean = false) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.arc(...position.getAsTuple(), radius, 0, Math.PI * 2);
  ctx.closePath();
  if (filled) ctx.fill();
  else ctx.stroke();
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

function randomID(length = 8) {
  return String(Math.floor(Math.random() * (Math.pow(10, length) - 1))).padStart(length, '0');
}

function updateUI() {
  buildFactoryButtons.forEach((button) => {
    button.classList.remove('selected');
    const inStorageCount = game.getStorage()[getBatteryDataById(Number(button.dataset.factory)).id];
    button.querySelectorAll('span')[1].innerText = inStorageCount.toString();
    button.disabled = inStorageCount === 0;
  });
  if (game.getSelectedFactory() !== undefined) document.querySelector(`button[data-factory="${game.getSelectedFactory()}"]`)!.classList.add('selected');

  taskInfoDiv.querySelector('h2')!.innerText = tasks[selectedTask].title;
  taskInfoDiv.querySelector('p')!.innerText = tasks[selectedTask].description;
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
  game = new Game(new Vec2(1600, 900), tasks[selectedTask]);
  gameElem.width = game.getMapSize().getX();
  gameElem.height = game.getMapSize().getY();
  loadResources();
  setupListeners();
  game.render();
  updateUI();
}

init();
