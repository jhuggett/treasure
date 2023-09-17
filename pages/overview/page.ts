import { UserInputTargets, select } from "../../deps.ts";
import { AppManager } from "../../framework/app-manager.ts";
import { Screen } from "../../framework/screen.ts";
import { debug } from "../../main.ts";
import { Save } from "../../save.ts";
import { DockedMenu } from "./widgets/docked-menu.ts";
import { InfoWidget } from "./widgets/info.ts";
import { MapWidget } from "./widgets/map.ts";

export type PageProps = {
  save: Save;
};

export class OverviewPage extends Screen<PageProps> {
  onInput: UserInputTargets = {
    Escape: () => {
      debug.log("Overview: Escape");
      this.pop();
    },
  };

  onPushed(): void {
    const { player, worldMap } = this.props.save;

    if (!player) {
      throw new Error("Save has no player");
    }

    if (!player?.ship) {
      throw new Error("Player has no ship");
    }

    if (!worldMap) {
      throw new Error("Save has no world map");
    }

    if (!worldMap.nodeManager) {
      throw new Error("World map has no node manager");
    }

    // should request the main view from the app manager
    const view = this.appManager.baseView;

    this.addWidget(
      MapWidget.create(view, {
        nodeManager: worldMap.nodeManager,
        ship: player.ship,
        time: this.props.save.time!,
      })
    );

    const infoView = view.layer({
      ...select([
        [200, 100],
        [2, 2],
        [30, 15],
      ]),
      newZIndexGroup: true,
    });

    this.addWidget(
      InfoWidget.create(infoView, {
        save: this.props.save,
      })
    );

    const confirmView = view.layer({
      ...select([
        [3, 3],
        [1, 1],
        [2, 2],
      ]),
      newZIndexGroup: true,
    });

    player.ship.onCollisionWithPort.subscribe((port) => {
      debug.log(`Docked for provisions.`);

      this.addWidget(
        DockedMenu.create(confirmView, {
          save: this.props.save,
        }),
        {
          focus: true,
        }
      );
    });
  }

  static create(appManager: AppManager, props: PageProps) {
    const page = new OverviewPage(appManager, props);

    return page;
  }
}
