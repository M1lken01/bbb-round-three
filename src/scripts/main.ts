const setUnlockedTasks = (value: number[] = [0]) => localStorage.setItem('unlocked_tasks', JSON.stringify(value));
const getUnlockedTasks = (): number[] => JSON.parse(localStorage.getItem('unlocked_tasks') ?? '[]');
if (getUnlockedTasks() === null) setUnlockedTasks();
const gameElem = document.querySelector('canvas#game') as HTMLCanvasElement;
const ctx = gameElem.getContext('2d') as CanvasRenderingContext2D;
const buildFactoryButtons = document.querySelectorAll('button.factory-button') as NodeListOf<HTMLButtonElement>;
const taskInfoDiv = document.querySelector('div#task') as HTMLDivElement;
const taskListDiv = document.querySelector('div#tasks') as HTMLDivElement;
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
type FactoryStorage = Record<BatteryType, number>;

type Task = { title: string; description: string; cities: City[]; storage: FactoryStorage };
const tasks: Task[] = [
  {
    title: 'tutorial',
    description: 'lorem',
    cities: [new City(0, new Vec2(373, 296)), new City(1, new Vec2(768, 469)), new City(2, new Vec2(1231, 372))],
    storage: {
      0: 1,
      1: 1,
      2: 1,
    },
  },
  { title: 'task', description: '', cities: [], storage: { 0: 2, 1: 2, 2: 2 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
];

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
  const task = game.getTask();
  taskInfoDiv.querySelector('h2')!.innerText = task.title;
  taskInfoDiv.querySelector('p')!.innerText = task.description;
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

function startTask(idx: number) {
  game = new Game(new Vec2(1600, 900), idx);
  gameElem.width = game.getMapSize().getX();
  gameElem.height = game.getMapSize().getY();
  game.render();
  updateUI();
}

async function init() {
  const unlockedTasks = getUnlockedTasks();
  for (let i = 0; i < tasks.length; i++) {
    const button = document.createElement('button');
    button.classList.add('gray-button');
    button.innerText = tasks[i].title;
    if (unlockedTasks.includes(i))
      button.addEventListener('click', () => {
        document.querySelector('div#menu-container')!.classList.add('!hidden');
        document.querySelector('div#game-container')!.classList.remove('!hidden');
        startTask(i);
      });
    else button.disabled = true;
    taskListDiv.appendChild(button);
  }
  loadResources();
  setupListeners();
}

init();
