import { Node } from "../node.ts";

export class RiverNode extends Node {
  sprite(brightness = 1) {
    const grassGreen = { r: 0, g: 175 * brightness, b: 0 };
    const riverBlue = { r: 0, g: 0, b: 175 * brightness };
    return [
      {
        character: "░",
        backgroundColor: grassGreen,
        foregroundColor: riverBlue,
      },
      {
        character: "░",
        backgroundColor: grassGreen,
        foregroundColor: riverBlue,
      },
    ];
  }
}
