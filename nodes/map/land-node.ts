import { Node, PointTraits } from "../node.ts";

export class LandNode extends Node {
  sprite(brightness = 1): PointTraits[] {
    const grassGreen = { r: 0, g: 110 * brightness, b: 0 };
    return [
      { character: " ", backgroundColor: grassGreen },
      { character: " ", backgroundColor: grassGreen },
    ];
  }
}
