import { Box, UserInputTargets } from "../../../deps.ts";
import { Widget } from "../../../framework/widget.ts";

export type MainMenuProps = {
  newGame: () => void;
};

export class MainMenuWidget extends Widget<MainMenuProps> {
  onInput: UserInputTargets = {
    Enter: () => {
      this.props.newGame();
    },
  };

  static create(view: Box, props: MainMenuProps) {
    return new MainMenuWidget(view, props);
  }

  draw() {
    this.view.clear();
    this.view.moveCursorTo({ x: "start", y: "start" });
    this.view.bufferedWriteString("Press Enter to start");
  }
}
