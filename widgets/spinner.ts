import { UserInputTargets, Box } from "../deps.ts";
import { Widget } from "../framework/widget.ts";

export type SpinnerProps = {};

export class SpinnerWidget extends Widget<SpinnerProps> {
  onInput: UserInputTargets = {};

  static create(view: Box, props: SpinnerProps) {
    return new SpinnerWidget(view, props);
  }

  draw() {
    this.view.clear();
    this.view.moveCursorTo({ x: "start", y: "start" });
    this.view.bufferedWriteString("Loading...");
  }
}
