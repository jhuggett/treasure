import { Box, DenoShell, UnknownKeyCodeError } from "../deps.ts";
import { debug } from "../main.ts";
import { Screen } from "./screen.ts";

export abstract class AppManager {
  screenStack: Screen<unknown>[] = [];

  get currentScreen(): Screen<unknown> | undefined {
    return this.screenStack[this.screenStack.length - 1];
  }

  constructor(public shell: DenoShell, public baseView: Box) {
    shell.onWindowResize(() => {
      this.currentScreen?.render();
    });
  }

  push(screen: Screen<unknown>) {
    //this.currentScreen?.freeze(this.shell);

    this.shell.clear();

    this.screenStack.push(screen);
    screen.onPushed?.();

    //screen.drawAndRender();
  }

  pop() {
    const screen = this.currentScreen;
    this.screenStack.pop();
    screen?.onPopped?.();

    this.shell.clear();

    this.currentScreen?.onPoppedTo?.();

    //this.currentScreen?.unfreeze(this.shell);

    //this.currentScreen?.drawAndRender();
  }

  replace(screen: Screen<unknown>) {
    const previousScreen = this.currentScreen;
    this.screenStack.pop();
    previousScreen?.onPopped?.();
    this.push(screen);
    // this.currentScreen?.drawAndRender();
  }

  async run() {
    while (this.screenStack.length > 0) {
      const screen = this.currentScreen;
      if (!screen) return;
      // screen.render();
      // this.shell.render();
      try {
        await screen.userInteractions();
      } catch (error) {
        if (error instanceof UnknownKeyCodeError) {
          debug.log("Unknown key code");
        }
      }
    }
  }
}
