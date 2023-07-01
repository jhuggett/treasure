import { Camera } from "./camera.ts";
import { Coordinate } from "./coordinate.ts";
import {
  Box,
  DenoShell,
  MathRandom,
  Squirrel3,
  UnknownKeyCodeError,
  userInput,
} from "./deps.ts";
import { GrowthMap, Landmass } from "./growth-map.ts";
import { MapNodeFactory } from "./nodes/map/factory.ts";
import { NodeManager } from "./nodes/node-manager.ts";
import { Ship } from "./nodes/ship-node.ts";

const setup = (shell: DenoShell) => {
  shell.setRaw(true);
  shell.showCursor(false);
  shell.clear();
};

const teardown = (shell: DenoShell) => {
  shell.clear();
  shell.setRaw(false);
  shell.showCursor(true);
};

const generateMap = (
  notifyProgress: (message: string) => void
): Promise<Landmass[]> => {
  return new Promise((resolve) => {
    const random = new Squirrel3(0, 0);

    notifyProgress("Generating map...");
    const growthMap = new GrowthMap(random);

    notifyProgress("Growing map...");
    growthMap.growToSize(10000);
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
};

const inputLoop = async (programContext: ProgramContext, camera: Camera) => {
  while (!programContext.requestingExit) {
    try {
      await userInput(shell, {
        "Arrow Up": () => {
          ship.move("north");
        },
        "Arrow Down": () => {
          ship.move("south");
        },
        "Arrow Left": () => {
          ship.move("west");
        },
        "Arrow Right": () => {
          ship.move("east");
        },
        Space: () => {
          camera.centerOnNode(ship);
        },
        Escape: () => {
          programContext.requestingExit = true;
        },
      });
    } catch (error) {
      if (!(error instanceof UnknownKeyCodeError)) {
        throw error;
      }
    }
  }
};

const requestMapRender = () => {
  debug.log("Rendering map...");
  landLayer.clear();

  nodeManager.nodesInCameraView(camera).forEach((node) => {
    landLayer.moveCursorTo({
      x: (node.currentPosition.x - camera.position.x) * 2,
      y: node.currentPosition.y - camera.position.y,
    });
    node.sprite().forEach((point) => {
      landLayer.bufferedWriteCharacter(point);
    });
  });

  displayInfo();

  shell.render();
};

const displayInfo = () => {
  infoLayer.clear();
  infoLayer.moveCursorTo({ x: "start", y: "start" });

  if (ship.lastDirection) {
    infoLayer.moveCursorHorizontally(4);
    infoLayer.moveCursorVertically(2);
    infoLayer.bufferedWriteString(
      ` bearing due -( ${ship.lastDirection.toUpperCase()} )-`
    );
  }
};

class ProgramContext {
  constructor(public requestingExit: boolean) {}
}

const shell = new DenoShell();

const programContext = new ProgramContext(false);

setup(shell);

const mainLayer = shell.getBoxRepresentation();

const { left, right } = mainLayer.splitHorizontally();

const { top, bottom } = left.splitVertically({});

const waterLayer = top.newLayer({});
const landLayer = waterLayer.newLayer({});

const infoLayer = bottom.newLayer({});

const debugLayer = right.newLayer({});
export const debug = {
  log: (msg: string) => {
    debugLayer.clear();
    debugLayer.moveCursorTo({ x: "start", y: "start" });
    debugLayer.bufferedWriteString(msg);
    shell.render();
  },
};

waterLayer.fill({ character: " ", backgroundColor: { r: 0, g: 0, b: 175 } });

const nodeManager = new NodeManager();

const camera = new Camera({
  getHeight: () => landLayer.height,
  getWidth: () => landLayer.width,
  position: new Coordinate(0, 0),
});
camera.onMove = requestMapRender;

const ship = new Ship(new Coordinate(5, 5));
nodeManager.addNode(ship);

ship.onPositionChange = () => {
  camera.centerOnNode(ship);
};

generateMap((msg) => {
  debug.log(msg);
}).then((landmasses) => {
  const nodes = landmasses
    .map((landmass) => landmass.points.all())
    .flat()
    .map((point) => MapNodeFactory.from(point.value));

  nodeManager.bulkAddNodes(nodes);

  debug.log("Map generated.");

  requestMapRender();
});

await inputLoop(programContext, camera);

teardown(shell);
