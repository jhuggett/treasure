import { UserInputTargets } from "../../deps.ts";
import { AppManager } from "../../framework/app-manager.ts";
import { Screen } from "../../framework/screen.ts";
import { Save } from "../../save.ts";
import { LoadingPage } from "../loading/page.ts";
import { MainMenuWidget } from "./widgets/menu.ts";

export class MainMenuPage extends Screen<void> {
  onInput: UserInputTargets = {
    Escape: () => {
      this.pop();
    },
  };

  onUnfrozen(): void {
    this.render();
  }

  onPushed() {
    this.addWidget(
      MainMenuWidget.create(this.appManager.baseView, {
        newGame: () => {
          const save = Save.new();

          this.appManager.push(
            LoadingPage.create(this.appManager, {
              save,
            })
          );
        },
      })
    );

    this.drawAndRender();
  }

  onPoppedTo(): void {
    this.drawAndRender();
  }

  static create(appManager: AppManager) {
    const page = new MainMenuPage(appManager);

    return page;
  }
}
