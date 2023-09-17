import { Node, PointTraits } from "../node.ts";

export class Port {}

export class CoastalNode extends Node {
  port?: Port;

  sprite(brightness = 1): PointTraits[] {
    const grassGreen = {
      r: (this.port ? 200 : 0) * brightness,
      g: 102 * brightness,
      b: (this.port ? 200 : 0) * brightness,
    };
    return [
      { character: " ", backgroundColor: grassGreen },
      { character: " ", backgroundColor: grassGreen },
    ];
  }
}
