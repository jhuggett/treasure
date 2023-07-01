import { Node } from "../node.ts";

export class MountainNode extends Node {
  sprite() {
    const stone = { r: 100, g: 100, b: 100 };
    return [
      { character: " ", backgroundColor: stone },
      { character: " ", backgroundColor: stone },
    ];
  }
}
