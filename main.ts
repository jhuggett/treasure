import { Layer } from "https://raw.githubusercontent.com/jhuggett/terminal/1.0.6/mod.ts";
import { Camera } from "./camera.ts";
import { Coordinate } from "./coordinate.ts";
import {
Box,
  DenoShell,
  PointGrid,
  Squirrel3,
  UnknownKeyCodeError,
  UserInputTargets,
  userInput,
  TargetMap
} from "./deps.ts";
import { GrowthMap, Landmass } from "./growth-map.ts";
import { CoastalNode, Port } from "./nodes/map/coastal-node.ts";
import { MapNodeFactory } from "./nodes/map/factory.ts";
import { NodeManager } from "./nodes/node-manager.ts";
import { Ship } from "./nodes/ship-node.ts";
import { Shell } from "../terminal/shells/shell.ts";
import { Key } from "../terminal/mod.ts";

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
};

// const inputLoop = async (programContext: ProgramContext, camera: Camera) => {
//   while (!programContext.requestingExit) {
//     try {
//       await userInput(shell, {
//         "Arrow Up": () => {
//           ship.move("north");
//         },
//         "Arrow Down": () => {
//           ship.move("south");
//         },
//         "Arrow Left": () => {
//           ship.move("west");
//         },
//         "Arrow Right": () => {
//           ship.move("east");
//         },
//         Space: () => {
//           camera.centerOnNode(ship);
//         },
//         Escape: () => {
//           programContext.requestingExit = true;
//         },
//       });
//     } catch (error) {
//       if (!(error instanceof UnknownKeyCodeError)) {
//         throw error;
//       }
//     }
//   }
// };

// const requestMapRender = () => {
//   debug.log("Rendering map...");
//   landLayer.clear();

//   nodeManager.nodesInCameraView(camera).forEach((node) => {
//     landLayer.moveCursorTo({
//       x: (node.currentPosition.x - camera.position.x) * 2,
//       y: node.currentPosition.y - camera.position.y,
//     });
//     node.sprite().forEach((point) => {
//       landLayer.bufferedWriteCharacter(point);
//     });
//   });

//   displayInfo();

//   shell.render();
// };

// const displayInfo = () => {
//   infoLayer.clear();
//   infoLayer.moveCursorTo({ x: "start", y: "start" });

//   if (ship.lastDirection) {
//     infoLayer.moveCursorHorizontally(4);
//     infoLayer.moveCursorVertically(2);
//     infoLayer.bufferedWriteString(
//       ` bearing due -( ${ship.lastDirection.toUpperCase()} )-`
//     );
//   }
// };

class ProgramContext {
  constructor(public requestingExit: boolean) {}
}

const shell = new DenoShell();

const programContext = new ProgramContext(false);

setup(shell);

// const mainLayer = shell.getBoxRepresentation();

// const { left, right } = mainLayer.splitHorizontally();

// const { top, bottom } = left.splitVertically({});

// const waterLayer = top.newLayer({});
// const landLayer = waterLayer.newLayer({});

// const infoLayer = bottom.newLayer({});

// const debugLayer = right.newLayer({});

const debugStack = []
export const debug = {
  log: (msg: string) => {
    debugStack.push(msg)
  },
};

// waterLayer.fill({ character: " ", backgroundColor: { r: 0, g: 0, b: 175 } });

const nodeManager = new NodeManager();


//camera.onMove = requestMapRender;

const ship = new Ship(new Coordinate(5, 5));
nodeManager.addNode(ship);

// ship.onPositionChange = () => {
//   camera.centerOnNode(ship);
// };


/*
- need a way to stack ui
- need to be able to control user input
  contexts (eg when a menu pops up, that
  menu is has control over receiving user interactions)

*/

class AppManager {
  screenStack: Screen[] = [];

  get currentScreen(): Screen | undefined {
    return this.screenStack[this.screenStack.length - 1];
  }

  constructor(private shell: DenoShell) {
    shell.onWindowResize(() => {
      this.currentScreen?.render();
    })
  }

  push(screen: Screen) {
    this.currentScreen?.freeze(this.shell);
    this.screenStack.push(screen);
  }

  pop() {
    this.screenStack.pop();
    this.currentScreen?.unfreeze(this.shell);
  }

  async run() {
    while (this.screenStack.length > 0) {
      const screen = this.currentScreen;
      if (!screen) return;
      screen.render();
      shell.render()
      await screen.userInteractions();
    }
  }
}

abstract class Screen {
  widgets: Widget[] = [];

  frozen = true

  pop() {
    appManager.pop();
  }

  frozenGrid?: PointGrid
  freeze(shell: Shell) {
    this.frozenGrid = shell.copyPointGrid();
    this.frozen = true
  }

  unfreeze(shell: Shell) {
    if (!this.frozen || !this.frozenGrid) return;
    shell.loadPointGrid(this.frozenGrid);
    this.frozen = false
  }

  protected abstract onInput: UserInputTargets;

  async userInteractions() {
    const targetMap = new TargetMap(this.onInput);
    if (this.focusedWidget) {
      targetMap.merge(new TargetMap(this.focusedWidget.onInput))
    }
    await userInput(shell, targetMap);
  }

  focusedWidget?: Widget;

  focusOn(widget: Widget) {
    if (this.focusedWidget) {
      this.focusedWidget.blur();
    }
    this.focusedWidget = widget;
    this.focusedWidget.focus();
  }

  render() {
    this.widgets.forEach((widget) => {
      widget.render();
    });
  }
}

abstract class Widget {
  abstract view: Box;
  focused = false;

  abstract onInput: UserInputTargets;
  abstract render(): void;

  onFocus?: () => void;
  onBlur?: () => void;

  focus() {
    this.focused = true;
    this.onFocus?.();
  }
  blur() {
    this.focused = false;
    this.onBlur?.();
  }
}


class OverviewPage extends Screen {
  onInput: UserInputTargets = {
    "Escape": () => {
      this.pop();
    }
  }

  constructor(shell: Shell, nodeManager: NodeManager, public ship: Ship) {
    super()
    this.widgets.push(new MapWidget(shell.getBoxRepresentation(), nodeManager, ship))

    this.focusOn(this.widgets[0])
  }
}

// Loading Page?
/*

Generic Loading page??? 
Or a generic spinner widget that resolves the generic type????

*/

class LoadingPage extends Screen {
  onInput: UserInputTargets = {
    "Escape": () => {
      this.pop();
      return 'stop propagation'
    }
  }

  constructor(shell: Shell, nodeManager: NodeManager, public ship: Ship) {
    super()
    this.widgets.push(new MapWidget(shell.getBoxRepresentation(), nodeManager, ship))
  }
}



class MapWidget extends Widget {
  camera: Camera

  backgroundView: Box
  nodeView: Box

  constructor(public view: Box, public nodeManager: NodeManager, public ship: Ship) {
    super()
    

    this.backgroundView = this.view.newLayer({})
    this.nodeView = this.backgroundView.newLayer({})

    this.backgroundView.fill({ character: " ", backgroundColor: { r: 0, g: 0, b: 175 } });


    const camera = new Camera({
      getHeight: () => this.nodeView.height,
      getWidth: () => this.nodeView.width,
      position: new Coordinate(0, 0),
    });

    ship.onPositionChange = () => {
      camera.centerOnNode(ship);
    };

    camera.onMove = () => {
      this.render()
    }

    this.camera = camera
  }



  render() {
    this.nodeView.clear();

    this.nodeManager.nodesInCameraView(this.camera).forEach((node) => {
      this.nodeView.moveCursorTo({
        x: (node.currentPosition.x - this.camera.position.x) * 2,
        y: node.currentPosition.y - this.camera.position.y,
      });
      node.sprite().forEach((point) => {
        this.nodeView.bufferedWriteCharacter(point);
      });
    });
  
    //displayInfo();
  }

  onInput: UserInputTargets = {
    "Arrow Up": () => {
      this.ship.move("north");
    },
    "Arrow Down": () => {
      this.ship.move("south");
    },
    "Arrow Left": () => {
      this.ship.move("west");
    },
    "Arrow Right": () => {
      this.ship.move("east");
    }
  }
}

const appManager = new AppManager(shell);

const overviewPage = new OverviewPage(shell, nodeManager, ship);

appManager.push(overviewPage);

shell.render()


generateMap((msg) => {
  //debug.log(msg);
}).then((landmasses) => {
  const nodes = landmasses
    .map((landmass) => landmass.points.all())
    .flat()
    .map((point) => MapNodeFactory.from(point.value));

  nodeManager.bulkAddNodes(nodes);

  //debug.log("Adding ports.");

  const coastalNodes = nodeManager.allNodes.filter((node) => {
    return node instanceof CoastalNode;
  }) as CoastalNode[];

  const random = new Squirrel3(0, 0);

  const portNode = random.getRandomItem(coastalNodes).item;

  portNode.port = new Port();

  const portNodeNeighbors = portNode.currentPosition.adjacentCoors

  const availableWater = portNodeNeighbors.filter((coor) => {
    return !nodeManager.checkCollision(coor)
  })

  const placeForShip = random.getRandomItem(availableWater).item

  ship.setPosition(placeForShip)

  //requestMapRender();
});

// await inputLoop(programContext);

await appManager.run()

teardown(shell);
