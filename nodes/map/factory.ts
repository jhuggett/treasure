import { Coordinate } from "../../coordinate.ts";
import { LandmassPoint, LandType } from "../../growth-map.ts";
import { LandNode } from "./land-node.ts";
import { MountainNode } from "./mountain-node.ts";
import { RiverNode } from "./river-node.ts";

export const MapNodeFactory = {
  land: (position: Coordinate) => new LandNode(position),
  river: (position: Coordinate) => new RiverNode(position),
  mountain: (position: Coordinate) => new MountainNode(position),
  from: (point: LandmassPoint) => {
    if (point.river) {
      return MapNodeFactory.river(point.coordinate);
    }

    if (point.landType === LandType.land || point.landType === LandType.coast) {
      return MapNodeFactory.land(point.coordinate);
    }

    if (
      point.landType === LandType.mountain ||
      point.landType === LandType.snowcapped
    ) {
      return MapNodeFactory.mountain(point.coordinate);
    }

    throw new Error("MapNodeFactory: Could not create node from point");
  },
};