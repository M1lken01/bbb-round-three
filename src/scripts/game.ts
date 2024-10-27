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
      drawCircle(this.mousePos.getZoomCorrected(), 100 * this.zoom, '#bbb');
      this.getCitiesInRange(this.mousePos, 100, this.selectedFactory).forEach((city) =>
        drawCircle(city.getPosition().getZoomCorrected(), 15 * this.zoom, '#eee', true),
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

    console.log(`is every city supplied ${this.cities.every((city) => city.isSupplied())}`);
    //! add check if the current task is done
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
