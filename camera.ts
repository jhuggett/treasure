import { Coordinate } from "./coordinate.ts";
import { debug } from "./main.ts";
import { Node } from "./nodes/node.ts";

export class Camera {
  public position: Coordinate;
  private getWidth: () => number;
  private getHeight: () => number;
  constructor({
    getHeight,
    getWidth,
    position,
  }: {
    position: Coordinate;
    getWidth: () => number;
    getHeight: () => number;
  }) {
    this.position = position;
    this.getWidth = getWidth;
    this.getHeight = getHeight;
  }

  get width() {
    return this.getWidth();
  }

  get height() {
    return this.getHeight();
  }

  moveTo(coordinate: Coordinate) {
    debug.log(`Moving camera to ${coordinate.asString}`);
    this.position = coordinate;
    this.onMove?.();
  }

  centerOnNode(node: Node) {
    const x = node.currentPosition.x - Math.floor(this.width / 4);
    const y = node.currentPosition.y - Math.floor(this.height / 2);
    this.moveTo(new Coordinate(x, y));
  }

  onMove?: () => void;
}
