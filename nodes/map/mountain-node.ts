import { Node } from "../node.ts";

export class MountainNode extends Node {
  sprite(brightness = 1) {
    const stone = {
      r: 100 * brightness,
      g: 100 * brightness,
      b: 100 * brightness,
    };
    return [
      { character: " ", backgroundColor: stone },
      { character: " ", backgroundColor: stone },
    ];
  }
}
