import { portion, margined } from "../../terminal/mod.ts";
import { Box, UserInputTargets } from "../deps.ts";
import { Widget } from "../framework/widget.ts";
import { Save } from "../misc/save.ts";
import { BulkItem } from "../nodes/ship-node.ts";

export type InfoWidgetProps = {
  save: Save;
};

export class InfoWidget extends Widget<InfoWidgetProps> {
  backgroundView: Box;
  textView: Box;

  private constructor(view: Box, props: InfoWidgetProps) {
    super(view, props);

    this.backgroundView = this.view.layer({ ...portion.full() });
    this.textView = this.backgroundView.layer({
      ...margined(this.backgroundView, 2, 1),
    });

    this.props.save.player?.ship?.onPositionChange.subscribe(() => {
      this.drawAndRender();
    });

    this.props.save.time?.onTimeChanged.subscribe(() => {
      this.drawAndRender();
    });

    this.props.save.player?.ship?.inventory.onChange.subscribe(() => {
      this.drawAndRender();
    });
  }

  static create(view: Box, props: InfoWidgetProps) {
    const widget = new InfoWidget(view, props);

    return widget;
  }

  draw() {
    this.textView.clear();

    this.backgroundView.fill({
      character: " ",
      backgroundColor: { r: 10, g: 10, b: 10 },
    });

    const foregroundColor = { r: 200, g: 200, b: 200 };

    this.textView.moveCursorTo({ x: "start", y: "start" });

    const ship = this.props.save.player?.ship;

    const time = this.props.save.time;

    const heading = ship?.lastDirection;

    if (heading) {
      this.textView.bufferedWriteString(`Heading due ${heading}.`, {
        foregroundColor,
      });
    } else {
      this.textView.bufferedWriteString(`Sails are furled.`, {
        foregroundColor,
      });
    }

    this.textView.carriageReturn();

    this.textView.bufferedWriteString(
      `Coordinates: ${ship?.currentPosition.x}, ${ship?.currentPosition.y}`,
      { foregroundColor }
    );

    this.textView.carriageReturn();

    this.textView.bufferedWriteString(`Current time: ${time?.currentTime()}`, {
      foregroundColor,
    });

    this.textView.carriageReturn();

    this.textView.bufferedWriteString(
      `Inventory: ${ship?.inventory.items.length} items`,
      { foregroundColor }
    );

    this.textView.carriageReturn();

    for (const item of ship?.inventory.items ?? []) {
      this.textView.bufferedWriteString(
        `- ${item.name} ${item instanceof BulkItem ? `(x${item.amount})` : ""}`,
        { foregroundColor }
      );
      this.textView.carriageReturn();
    }
  }

  onInput: UserInputTargets = {};
}
