import { Squirrel3 } from "./deps.ts";
import { Landmass, GrowthMap } from "./growth-map.ts";
import { CoastalNode, Port } from "./nodes/map/coastal-node.ts";
import { MapNodeFactory } from "./nodes/map/factory.ts";
import { NodeManager } from "./nodes/node-manager.ts";
import { Ship } from "./nodes/ship-node.ts";

export class WorldMap {
  nodeManager?: NodeManager;

  private generateLandmasses(
    notifyProgress: (message: string) => void
  ): Promise<Landmass[]> {
    return new Promise((resolve) => {
      const random = new Squirrel3(0, 0);

      notifyProgress("Generating map...");
      const growthMap = new GrowthMap(random);

      notifyProgress("Growing map...");
      growthMap.growToSize(1000);
      notifyProgress("Pruning map...");
      growthMap.pruneScaffolding();

      notifyProgress("Loading tree...");
      growthMap.loadTree();

      notifyProgress("Identifying landmasses...");
      const landmasses = growthMap.identifyLandmasses();

      for (const landmass of landmasses) {
        notifyProgress(`Getting costal points ...`);
        landmass.getCostalPoints();
        notifyProgress(`Softening landmass ...`);
        landmass.soften();
        notifyProgress(`Getting coastal rings ...`);
        landmass.getCoastalRings();
        notifyProgress(`Calculating distance to water ...`);
        landmass.distanceToWater();
        notifyProgress(`Growing mountains ...`);
        landmass.growMountains();
        notifyProgress(`Calculating distance to mountains ...`);
        landmass.findDistanceToMountains();
        notifyProgress(`Calculating elevation ...`);
        landmass.calculateElevation();
        notifyProgress(`Generating rivers ...`);
        landmass.generateRivers();
      }

      notifyProgress("Done.");

      resolve(landmasses);
    });
  }

  portNodes: CoastalNode[] = [];
  addPorts() {
    const coastalNodes = this.nodeManager?.allNodes.filter((node) => {
      return node instanceof CoastalNode;
    }) as CoastalNode[];

    const random = new Squirrel3(0, 0);

    for (let i = 0; i < 5; i++) {
      const portNode = random.getRandomItem(coastalNodes).item;

      portNode.port = new Port();

      this.portNodes.push(portNode);
    }
  }

  async initialize() {
    const landmasses = await this.generateLandmasses(() => {});
    const nodes = landmasses
      .map((landmass) => landmass.points.all())
      .flat()
      .map((point) => MapNodeFactory.from(point.value));

    this.nodeManager = new NodeManager();

    this.nodeManager.bulkAddNodes(nodes);
  }

  placePlayerShip(ship: Ship) {
    const random = new Squirrel3(0, 0);

    const portNode = random.getRandomItem(this.portNodes).item;

    const portNodeNeighbors = portNode.currentPosition.adjacentCoors;

    const availableWater = portNodeNeighbors.filter((coor) => {
      return !this.nodeManager?.checkCollision(coor);
    });

    const placeForShip = random.getRandomItem(availableWater).item;

    ship.setPosition(placeForShip);
  }
}
