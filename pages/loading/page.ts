import { Coordinate } from "../../coordinate.ts";
import { UserInputTargets } from "../../deps.ts";
import { AppManager } from "../../framework/app-manager.ts";
import { Screen } from "../../framework/screen.ts";
import { debug } from "../../main.ts";
import { Money, Provisions, Ship } from "../../nodes/ship-node.ts";
import { Save } from "../../save.ts";
import { OverviewPage } from "../overview/page.ts";
import { SpinnerWidget } from "./widgets/spinner.ts";

export type LoadingPageProps = {
  save: Save;
};

export class LoadingPage extends Screen<LoadingPageProps> {
  onInput: UserInputTargets = {
    Escape: () => {
      this.appManager.pop();
      return "stop propagation";
    },
  };

  async initializeGame(onDone: () => void) {
    const save = this.props.save;
    const { player, worldMap } = save;

    await worldMap?.initialize();
    worldMap?.addPorts();

    if (!player) {
      throw new Error("Save has no player");
    }

    if (!player?.ship) {
      player.ship = new Ship(new Coordinate(0, 0));
    }

    player.ship.inventory.add(Provisions.create(100));
    player.ship.inventory.add(Money.create(100));

    worldMap?.nodeManager?.addNode(player.ship);

    worldMap?.placePlayerShip(player.ship);

    save.time?.schedule(1, () => {
      if (!player.ship) {
        throw new Error("Save has no player ship");
      }

      const provisions = Provisions.findIn(player.ship.inventory);

      if (!provisions) {
        debug.log(`Out of provisions! Game over!`);
        return;
      }

      provisions.remove(player.ship.provisionsConsumedPerDay());

      return {
        repeatAfter: 1,
      };
    });

    onDone();
  }

  onPushed(): void {
    this.addWidget(SpinnerWidget.create(this.appManager.baseView, {}));

    this.initializeGame(() => {
      this.appManager.replace(
        OverviewPage.create(this.appManager, {
          save: this.props.save,
        })
      );
    });
  }

  static create(appManager: AppManager, props: LoadingPageProps) {
    const page = new LoadingPage(appManager, props);

    return page;
  }
}
