import { DenoShell } from "./deps.ts";
import { TreasureAppManager } from "./app-manager.ts";
import { MainMenuPage } from "./pages/main-menu-page.ts";

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

const shell = new DenoShell();

setup(shell);

const mainView = shell.getBoxRepresentation();

const appView = mainView.layer({
  division: {
    x: 3,
    y: 1,
  },
  start: {
    x: 0,
    y: 0,
  },
  end: {
    x: 2,
    y: 1,
  },
});

const debugBackgroundView = mainView.layer({
  division: {
    x: 3,
    y: 1,
  },
  start: {
    x: 2,
    y: 0,
  },
  end: {
    x: 3,
    y: 1,
  },
});

const debugView = debugBackgroundView.layer({
  division: {
    x: 100,
    y: 100,
  },
  start: {
    x: 3,
    y: 2,
  },
  end: {
    x: 97,
    y: 98,
  },
});

export const debug = {
  log: (msg: string) => {
    try {
      debugBackgroundView.fill({
        character: " ",
        backgroundColor: { r: 10, g: 10, b: 10 },
      });
      debugView.bufferedWriteString(msg);
      debugView.carriageReturn();
    } catch (error) {
      debugView.clear();
      debugView.moveCursorTo({ x: "start", y: "start" });
      debugView.bufferedWriteString(msg);
    }
    shell.render();
  },
};

const appManager = new TreasureAppManager(shell, appView);

appManager.push(MainMenuPage.create(appManager));

await appManager.run();

teardown(shell);

/*
################
## TODO BOARD ##
################


- [ ] Trading

- [ ] Add a way to save the game
- [ ] Add a way to load the game

################
##   NOTES    ##
################

Producers
  - make stuff
  - must be able to pay workers
  - value of goods is based on cost to produce (time * wages) + materials + demand (rolling daily demand, based on how much is in the market and how much can be produced)

Markets
  - buy goods from producers
  - sell goods to consumers (???)

Guilds
  - can join
  - fairly independent
  - pays dues
  - grant protection from other guild members

Companies
  - can join
  - can do contract (eg delivering goods to other markets)
  - paid per contract

*/
