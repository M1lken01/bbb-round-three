const setUnlockedTasks = (value: number[] = [0]) => localStorage.setItem('unlocked_tasks', JSON.stringify(value));
const getUnlockedTasks = (): number[] => JSON.parse(localStorage.getItem('unlocked_tasks') ?? '[]');
const addUnlockedTasks = (value: number = 0) => setUnlockedTasks(Array.from(new Set([...getUnlockedTasks(), value])));
const setCompletedTasks = (value: number[] = [0]) => localStorage.setItem('completed_tasks', JSON.stringify(value));
const getCompletedTasks = (): number[] => JSON.parse(localStorage.getItem('completed_tasks') ?? '[]');
const addCompletedTasks = (value: number = 0) => setCompletedTasks(Array.from(new Set([...getCompletedTasks(), value])));
if (getUnlockedTasks().length === 0) setUnlockedTasks();
const gameElem = document.querySelector('canvas#game') as HTMLCanvasElement;
const ctx = gameElem.getContext('2d') as CanvasRenderingContext2D;
const buildFactoryButtons = document.querySelectorAll('button.factory-button') as NodeListOf<HTMLButtonElement>;
const menuContainerDiv = document.querySelector('div#menu-container') as HTMLDivElement;
const gameContainerDiv = document.querySelector('div#game-container') as HTMLDivElement;
const restartOrNextButton = document.querySelector('button#restart-or-next') as HTMLButtonElement;
const backButton = document.querySelector('button#back') as HTMLButtonElement;
const taskInfoDiv = document.querySelector('div#task') as HTMLDivElement;
const taskInfoTitle = taskInfoDiv.querySelector('h2') as HTMLHeadingElement;
const taskInfoDesc = taskInfoDiv.querySelector('p') as HTMLParagraphElement;
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
type Task = { title: string; description: string; cities: City[]; storage: FactoryStorage; unlocks?: number[] };

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

function updateUI() {
  buildFactoryButtons.forEach((button) => {
    button.classList.remove('selected');
    const inStorageCount = game.getStorage()[getBatteryDataById(Number(button.dataset.factory)).id];
    button.querySelectorAll('span')[1].innerText = inStorageCount.toString();
    button.disabled = inStorageCount === 0;
  });
  if (game.getSelectedFactory() !== undefined) document.querySelector(`button[data-factory="${game.getSelectedFactory()}"]`)!.classList.add('selected');
  const task = game.getTask();
  let title = task.title;
  taskInfoTitle.classList.remove('easteregg');
  if (task.storage[69] === 1 && getCompletedTasks().length === tasks.length) {
    taskInfoTitle.classList.add('easteregg');
    title = 'Köszönjük, hogy játszottál!';
  }
  taskInfoTitle.innerText = title;
  taskInfoDesc.innerText = task.description;
  restartOrNextButton.innerText = game.isTaskComplete() ? 'Következő' : 'Újrakezdés';
}

function getBatteryDataById(id: BatteryType) {
  return batteryData.find((battery) => battery.id === id)!;
}

function randomId(length = 8) {
  return String(Math.floor(Math.random() * (Math.pow(10, length) - 1))).padStart(length, '0');
}

function setupListeners() {
  restartOrNextButton.addEventListener('click', () => {
    if (game.isTaskComplete()) nextTask();
    else startTask(game.getTaskIdx());
  });
  backButton.addEventListener('click', () => {
    game = new Game(new Vec2(), 0);
    toggleMenu(1);
  });
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

function nextTask() {
  const nextIdx = game.getTaskIdx() + 1;
  startTask(getUnlockedTasks().includes(nextIdx) ? nextIdx : game.getTaskIdx());
}

function toggleMenu(forceShow = -1) {
  if (forceShow === 1) {
    menuContainerDiv.classList.remove('!hidden');
    gameContainerDiv.classList.add('!hidden');
  } else if (forceShow === 0) {
    menuContainerDiv.classList.add('!hidden');
    gameContainerDiv.classList.remove('!hidden');
  } else {
    menuContainerDiv.classList.toggle('!hidden');
    gameContainerDiv.classList.toggle('!hidden');
  }
  loadTasks();
}

function startTask(idx: number) {
  game = new Game(new Vec2(1600, 900), idx);
  gameElem.width = game.getMapSize().getX();
  gameElem.height = game.getMapSize().getY();
  game.render();
  updateUI();
}

function loadTasks() {
  taskListDiv.innerHTML = '';
  const unlockedTasks = getUnlockedTasks();
  const completedTasks = getCompletedTasks();
  for (let i = 0; i < tasks.length; i++) {
    const button = document.createElement('button');
    button.classList.add('gray-button');
    button.innerText = tasks[i].title;
    if (unlockedTasks.includes(i)) {
      button.addEventListener('click', () => {
        toggleMenu(0);
        startTask(i);
      });
      if (completedTasks.includes(i)) {
        button.classList.add('completed');
      }
    } else button.disabled = true;

    taskListDiv.appendChild(button);
  }
}

async function init() {
  loadTasks();
  loadResources();
  setupListeners();
}

init();
