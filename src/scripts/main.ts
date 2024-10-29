const setUnlockedTasks = (value: number[] = [0]) => localStorage.setItem('unlocked_tasks', JSON.stringify(value));
const getUnlockedTasks = (): number[] => JSON.parse(localStorage.getItem('unlocked_tasks') ?? '[]');
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
const tasks: Task[] = [
  {
    title: 'Tutorial',
    description: 'lorem',
    cities: [new City(0, new Vec2(373, 296)), new City(1, new Vec2(768, 469)), new City(2, new Vec2(1231, 372))],
    storage: { 0: 1, 1: 1, 2: 1 },
    unlocks: [1, 2, 3],
  },
  {
    title: 'Red County',
    description: 'Supply the red cities in Red County while balancing resources across green and blue.',
    cities: [
      new City(1, new Vec2(310, 304), 'Green City'),
      new City(2, new Vec2(710, 448), 'Blue City'),
      new City(0, new Vec2(1110, 349), 'Red City 1'),
      new City(0, new Vec2(1099, 540), 'Red City 2'),
      new City(0, new Vec2(501, 205), 'Red City 3'),
      new City(0, new Vec2(396, 598), 'Red City 4'),
      new City(0, new Vec2(998, 696), 'Red City 5'),
      new City(0, new Vec2(550, 551), 'Red City 6'),
      new City(0, new Vec2(660, 255), 'Red City 7'),
      new City(0, new Vec2(1150, 404), 'Red City 8'),
      new City(0, new Vec2(1242, 298), 'Red City 9'),
    ],
    storage: { 0: 4, 1: 1, 2: 1 },
  },
  {
    title: 'Blue Ridge',
    description: 'Supply clusters of blue cities across the Blue Ridge area, maintaining efficiency and resource management.',
    cities: [
      new City(0, new Vec2(349, 329), 'Red City'),
      new City(2, new Vec2(907, 446), 'Green City'),
      new City(1, new Vec2(270, 146), 'Blue City 1'),
      new City(1, new Vec2(444, 140), 'Blue City 2'),
      new City(1, new Vec2(367, 230), 'Blue City 3'),
      new City(1, new Vec2(685, 545), 'Blue City 4'),
      new City(1, new Vec2(727, 380), 'Blue City 5'),
      new City(1, new Vec2(818, 500), 'Blue City 6'),
      new City(1, new Vec2(1236, 347), 'Blue City 8'),
      new City(1, new Vec2(1149, 429), 'Blue City 9'),
      new City(1, new Vec2(1307, 401), 'Blue City 10'),
      new City(1, new Vec2(1190, 527), 'Blue City 11'),
      new City(1, new Vec2(369, 618), 'Blue City 13'),
      new City(1, new Vec2(211, 675), 'Blue City 14'),
      new City(1, new Vec2(396, 718), 'Blue City 15'),
      new City(1, new Vec2(297, 762), 'Blue City 16'),
    ],
    storage: { 0: 1, 1: 4, 2: 1 },
  },
  {
    title: 'Green Province',
    description: 'An all-green challenge, connect each green city with factories nearby!',
    cities: [
      new City(0, new Vec2(162, 256), 'Red City 1'),
      new City(0, new Vec2(300, 255), 'Red City 2'),
      new City(0, new Vec2(237, 347), 'Red City 3'),
      new City(1, new Vec2(258, 279), 'Blue City 1'),
      new City(1, new Vec2(344, 175), 'Blue City 2'),
      new City(1, new Vec2(426, 297), 'Blue City 3'),
      new City(2, new Vec2(646, 531), 'Green City 1'),
      new City(2, new Vec2(487, 609), 'Green City 2'),
      new City(2, new Vec2(517, 740), 'Green City 3'),
      new City(2, new Vec2(715, 441), 'Green City 4'),
      new City(2, new Vec2(835, 474), 'Green City 5'),
      new City(2, new Vec2(811, 583), 'Green City 6'),
      new City(2, new Vec2(1109, 194), 'Green City 7'),
      new City(2, new Vec2(1025, 361), 'Green City 8'),
      new City(2, new Vec2(996, 257), 'Green City 9'),
      new City(2, new Vec2(1171, 333), 'Green City 10'),
      new City(2, new Vec2(1226, 362), 'Green City 11'),
      new City(2, new Vec2(1270, 538), 'Green City 12'),
    ],
    storage: { 0: 1, 1: 1, 2: 4 },
    unlocks: [4, 5, 6, 7],
  },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 }, unlocks: [8, 9, 10] },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 1, 1: 1, 2: 1 } },
  { title: 'task', description: '', cities: [], storage: { 0: 0, 1: 0, 2: 0 } },
  { title: 'M&M', description: 'This level is unachievable without cheating.', cities: [], storage: { 0: 0, 1: 0, 2: 0, 69: 1 } },
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
  if (task.storage[69] === 1) {
    taskInfoTitle.classList.add('easteregg');
    title = 'Thanks for playing!';
  }
  taskInfoTitle.innerText = title;
  taskInfoDesc.innerText = task.description;
  restartOrNextButton.innerText = game.isTaskComplete() ? 'Next' : 'Restart';
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
  for (let i = 0; i < tasks.length; i++) {
    const button = document.createElement('button');
    button.classList.add('gray-button');
    button.innerText = tasks[i].title;
    if (unlockedTasks.includes(i))
      button.addEventListener('click', () => {
        toggleMenu(0);
        startTask(i);
      });
    else button.disabled = true;
    taskListDiv.appendChild(button);
  }
}

async function init() {
  loadTasks();
  loadResources();
  setupListeners();
}

init();
