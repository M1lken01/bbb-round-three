class City {
  private batteryType: BatteryType;
  private position: Vec2;
  private size = 25;
  private range = 100;
  private name: string;
  private supplied: boolean = false;

  constructor(batteryType: BatteryType, position: Vec2 = new Vec2(), name: string = 'City') {
    this.batteryType = batteryType;
    this.position = position;
    this.name = name;
  }

  public draw() {
    const size = this.size * game.getZoom();
    const pos = this.position.getZoomCorrected().subtract(size / 2);
    ctx.drawImage(getBatteryDataById(this.batteryType).cityImg ?? toImage(getBatteryDataById(this.batteryType).citySrc), ...pos.getAsTuple(), size, size);
    ctx.font = `${16 * Math.max(1, game.getZoom() / 2)}px Helvetica`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, pos.getX() + size / 2, pos.getY() + size * 1.5);
  }

  public getBatteryType(): BatteryType {
    return this.batteryType;
  }

  public getPosition(): Vec2 {
    return this.position;
  }

  public supply(value = true) {
    this.supplied = value;
  }

  public unSupply() {
    this.supplied = game.getFactoriesInRange(this.position, this.range, this.batteryType).length > 1;
  }

  public isSupplied() {
    return this.supplied;
  }

  public copy() {
    return new City(this.batteryType, this.position, this.name);
  }
}
