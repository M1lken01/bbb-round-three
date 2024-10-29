class Game {
  private cities: City[] = [];
  private factories: Factory[] = [];
  private selectedFactory?: BatteryType;
  private hoveredFactory?: Factory;
  private mousePos = new Vec2();
  private mapSize: Vec2;
  private zoom = 1;
  private pan: Vec2;
  private isDragging = false;
  private dragStart = new Vec2();
  private task: Task;
  private buildingSize = 25;
  private storage: FactoryStorage;

  constructor(mapSize: Vec2, taskIdx: number) {
    this.task = tasks[taskIdx];
    this.storage = JSON.parse(JSON.stringify(this.task.storage));
    this.mapSize = mapSize;
    this.pan = this.mapSize.subtract(this.getMapAsVector()).divide(2);
    this.task.cities.forEach((city) => this.addCity(city));
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

    if (!this.isDragging) {
      if (this.selectedFactory !== undefined) {
        drawCircle(this.mousePos.getZoomCorrected(), 100 * this.zoom, this.buildFactory(this.selectedFactory, this.mousePos, false) ? '#bbb' : '#f55');
        this.getCitiesInRange(this.mousePos, 100, this.selectedFactory).forEach((city) =>
          drawCircle(city.getPosition().getZoomCorrected(), 15 * this.zoom, '#eee', true),
        );
      } else {
        const closestFactory = this.getFactoriesInRange(this.mousePos, this.buildingSize)[0];
        this.hoveredFactory = closestFactory;
        if (closestFactory) drawCircle(closestFactory.getPosition().getZoomCorrected(), 15 * this.zoom, '#f55', true);
      }
    }

    this.factories.forEach((obj) => obj.draw());
    this.cities.forEach((obj) => obj.draw());
    ctx.restore();
    requestAnimationFrame(() => this.render());
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
  }

  handleClick(event: MouseEvent) {
    this.handleMouse(event);
    if (this.selectedFactory !== undefined) {
      if (this.buildFactory(this.selectedFactory, this.mousePos)) this.selectedFactory = undefined;
    } else if (this.hoveredFactory !== undefined) {
      if (confirm('demolish factory?')) {
        const idx = this.getFactoryIdxById(this.hoveredFactory.getId());
        if (idx >= 0 && idx < this.factories.length) {
          this.factories.splice(idx, 1);
          this.storage[this.hoveredFactory.getType()]++;
          this.hoveredFactory = undefined;
        }
      }
    }
    updateUI();
  }

  handleMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.dragStart = new Vec2(event.clientX, event.clientY).subtract(this.pan);
  }

  handleMouseMove(event: MouseEvent) {
    this.handleMouse(event);
    if (this.isDragging) this.setPan(new Vec2(event.clientX, event.clientY).subtract(this.dragStart));
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

  buildFactory(battery: BatteryType, location: Vec2, build = true) {
    const canBuild =
      this.storage[battery] > 0 &&
      this.getCitiesInRange(location, this.buildingSize).length === 0 &&
      this.getFactoriesInRange(location, this.buildingSize).length === 0;
    if (canBuild && build) {
      this.factories.push(new Factory(battery, location));
      this.storage[battery]--;
      if (this.isTaskComplete()) {
        alert('task completed');
        setUnlockedTasks([...getUnlockedTasks(), getUnlockedTasks().reverse()[0] + 1]);
      }
    }
    return canBuild;
  }

  isTaskComplete() {
    return this.cities.every((city) => city.isSupplied());
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

  getCitiesInRange(vector: Vec2, range: number, type?: BatteryType) {
    return game.getCities().filter((city) => (type === undefined || city.getBatteryType() === type) && vector.getDistanceFrom(city.getPosition()) <= range);
  }

  getFactoriesInRange(vector: Vec2, range: number) {
    return game.getFactories().filter((factory) => vector.getDistanceFrom(factory.getPosition()) <= range);
  }

  getFactoryIdxById(id: string) {
    return game.getFactories().findIndex((factory) => factory.getId() === id);
  }

  getStorage() {
    return this.storage;
  }

  getTask() {
    return this.task;
  }
}
