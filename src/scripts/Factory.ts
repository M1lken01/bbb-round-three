class Factory {
  private id: string;
  private batteryType: BatteryType;
  private position: Vec2;
  private size = 25;
  private range = 100;

  constructor(batteryType: BatteryType, position: Vec2 = new Vec2()) {
    this.id = randomId();
    this.batteryType = batteryType;
    this.position = position;
    game.getCitiesInRange(this.position, this.range, this.batteryType).forEach((city) => city.supply());
  }

  public draw() {
    const size = this.size * game.getZoom();
    const battery = getBatteryDataById(this.batteryType);
    ctx.strokeStyle = battery.color;
    ctx.lineWidth = 2;
    game.getCitiesInRange(this.position, this.range, this.batteryType).forEach((city) => {
      ctx.beginPath();
      ctx.moveTo(...this.position.getZoomCorrected().getAsTuple());
      ctx.lineTo(...city.getPosition().getZoomCorrected().getAsTuple());
      ctx.closePath();
      ctx.stroke();
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

  public destroy(): void {
    game.getCitiesInRange(this.position, this.range, this.batteryType).forEach((city) => city.unSupply());
  }

  public getId(): string {
    return this.id;
  }

  public getType(): BatteryType {
    return this.batteryType;
  }

  public getPosition(): Vec2 {
    return this.position;
  }
}
