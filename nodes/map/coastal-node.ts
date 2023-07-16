import { Node, PointTraits } from "../node.ts";

export class Port {}

export class CoastalNode extends Node {

  port?: Port;

  sprite(): PointTraits[] {
    const grassGreen = { r: this.port ? 200 : 0, g: 160, b: this.port ? 200 : 0 };
    return [
      { character: " ", backgroundColor: grassGreen },
      { character: " ", backgroundColor: grassGreen },
    ];
  }
}
