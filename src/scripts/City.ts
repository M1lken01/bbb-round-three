class City {
  private batteryType: BatteryType;
  private position: Vec2;
  private size = 25;
  private supplied: boolean = false;

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

  public supply() {
    this.supplied = true;
  }

  public isSupplied() {
    return this.supplied;
  }
}
