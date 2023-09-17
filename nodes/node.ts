import { Coordinate } from "../coordinate.ts";
import { Point } from "../deps.ts";
import { SubscribableEvent } from "../subscribable-event.ts";
import { NodeManager } from "./node-manager.ts";

export type PointTraits = Omit<Point, "zIndex" | "coordinate">;

export abstract class Node {
  constructor(private position: Coordinate, protected manager?: NodeManager) {}

  setPosition(position: Coordinate) {
    if (!position) {
      throw new Error("Node::setPosition: no position provided");
    }
    this.position = position;
    this.onPositionChange.emit();
    if (this.manager) {
      this.manager.onNodeMoved();
    }
  }

  seen = false;

  onPositionChange = new SubscribableEvent<void>();

  assignManager(manager: NodeManager) {
    this.manager = manager;
  }

  get currentPosition(): Readonly<Coordinate> {
    return this.position;
  }

  abstract sprite(brightness?: number): PointTraits[];
}
