import { CompassDirection } from "../coordinate.ts";
import { debug } from "../main.ts";
import { RiverNode } from "./map/river-node.ts";
import { Node } from "./node.ts";

export class Ship extends Node {
  move(direction: CompassDirection) {
    debug.log(
      `Moving ${direction}. Current position: ${
        this.currentPosition.asString
      }. New position: ${this.currentPosition.offset(direction, 1).asString}`
    );
    const newPosition = this.currentPosition.offset(direction, 1);

    const collidedNode = this.manager?.checkCollision(newPosition);
    if (collidedNode) {
      debug.log("Collision detected!");
      if (collidedNode.value instanceof RiverNode) {
        debug.log("River detected!");
      } else {
        // return;
      }
    }

    this.lastDirection = direction;

    this.setPosition(newPosition);
  }

  lastDirection?: CompassDirection;

  sprite() {
    return [
      { character: "█", foregroundColor: { r: 255, g: 255, b: 255 } },
      { character: "█", foregroundColor: { r: 255, g: 255, b: 255 } },
    ];
  }
}
