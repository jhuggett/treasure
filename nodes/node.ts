import { Coordinate } from "../coordinate.ts";
import { Point } from "../deps.ts";
import { debug } from "../main.ts";
import { NodeManager } from "./node-manager.ts";

export type PointTraits = Omit<Point, "zIndex" | "coordinate">;

export abstract class Node {
  constructor(private position: Coordinate, protected manager?: NodeManager) {}

  setPosition(position: Coordinate) {
    if (!position) {
      throw new Error("Node::setPosition: no position provided");
    }
    this.position = position;
    debug.log(
      `Node moved to ${this.position.asString}, manager ${
        this.manager ? "exists" : "does not exist"
      }`
    );
    this.onPositionChange?.();
    if (this.manager) {
      this.manager.onNodeMoved();
    }
  }

  onPositionChange?: () => void;

  assignManager(manager: NodeManager) {
    this.manager = manager;
  }

  get currentPosition(): Readonly<Coordinate> {
    return this.position;
  }

  abstract sprite(): PointTraits[];
}
