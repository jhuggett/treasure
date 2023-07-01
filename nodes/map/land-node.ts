import { Node, PointTraits } from "../node.ts";

export class LandNode extends Node {
  sprite(): PointTraits[] {
    const grassGreen = { r: 0, g: 175, b: 0 };
    return [
      { character: " ", backgroundColor: grassGreen },
      { character: " ", backgroundColor: grassGreen },
    ];
  }
}
