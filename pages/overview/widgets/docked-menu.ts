import { margined } from "../../../../terminal/mod.ts";
import { Box, UserInputTargets } from "../../../deps.ts";
import { Widget } from "../../../framework/widget.ts";
import { debug } from "../../../main.ts";
import { Money, Provisions } from "../../../nodes/ship-node.ts";
import { Save } from "../../../save.ts";

export type DockedMenuWidgetProps = {
  save: Save;
};

export class DockedMenu extends Widget<DockedMenuWidgetProps> {
  textView: Box;
  backgroundView: Box;

  private constructor(view: Box, props: DockedMenuWidgetProps) {
    super(view, props);

    this.view.fill({
      character: " ",
      backgroundColor: { r: 150, g: 150, b: 150 },
    });

    this.backgroundView = this.view.layer({
      ...margined(this.view, 2, 1),
    });

    this.textView = this.backgroundView.layer({
      ...margined(this.backgroundView, 2, 1),
    });

    this.drawAndRender();
  }

  static create(view: Box, props: DockedMenuWidgetProps) {
    const widget = new DockedMenu(view, props);

    return widget;
  }

  onFocus(): void {
    this.drawAndRender();
  }

  onDismiss(): void {
    this.view.clear();
    this.backgroundView.clear();
    this.textView.clear();
  }

  options: string[] = ["Beg for money", "Steal provisions", "Leave"];

  draw() {
    this.backgroundView.fill({
      character: " ",
      backgroundColor: { r: 20, g: 20, b: 20 },
    });

    const textColor = { r: 160, g: 160, b: 160 };

    this.textView.moveCursorTo({ x: "start", y: "start" });
    this.textView.bufferedWriteString(`You've docked at this port. What now?`, {
      foregroundColor: textColor,
    });
    this.textView.carriageReturn();
    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i];
      this.textView.bufferedWriteString(
        `${this.selection === i ? `-->` : `   `} ${i + 1}. ${option}`,
        {
          foregroundColor: textColor,
        }
      );
      this.textView.carriageReturn();
    }
  }
  selection = 0;

  onInput: UserInputTargets = {
    Escape: () => {
      this.dismiss();
      this.screen?.drawAndRender();
      return "stop propagation";
    },
    "Arrow Up": () => {
      this.selection = Math.max(0, this.selection - 1);
      this.drawAndRender();
      return "stop propagation";
    },
    "Arrow Down": () => {
      this.selection = Math.min(this.options.length - 1, this.selection + 1);
      this.drawAndRender();
      return "stop propagation";
    },
    Enter: () => {
      switch (this.options[this.selection]) {
        case "Leave":
          this.dismiss();
          this.screen?.drawAndRender();
          return "stop propagation";
        case "Beg for money":
          this.props.save.player?.ship?.inventory.add(
            Money.create(this.props.save.random.getRandomNumber(1, 5))
          );
          return "stop propagation";
        case "Steal provisions":
          this.props.save.player?.ship?.inventory.add(
            Provisions.create(this.props.save.random.getRandomNumber(1, 10))
          );
          return "stop propagation";
      }
    },
  };
}
