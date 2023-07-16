import { Coordinate } from "../../coordinate.ts";
import { LandmassPoint, LandType } from "../../growth-map.ts";
import { CoastalNode } from "./coastal-node.ts";
import { LandNode } from "./land-node.ts";
import { MountainNode } from "./mountain-node.ts";
import { RiverNode } from "./river-node.ts";

export const MapNodeFactory = {
  land: (position: Coordinate) => new LandNode(position),
  river: (position: Coordinate) => new RiverNode(position),
  mountain: (position: Coordinate) => new MountainNode(position),
  coast: (position: Coordinate) => new CoastalNode(position),
  from: (point: LandmassPoint) => {
    if (point.river) {
      return MapNodeFactory.river(point.coordinate);
    }

    if (point.landType === LandType.land) {
      return MapNodeFactory.land(point.coordinate);
    }

    if (point.landType === LandType.coast) {
      return MapNodeFactory.coast(point.coordinate);
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
