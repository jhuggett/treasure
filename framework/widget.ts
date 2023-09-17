import { Box, UserInputTargets } from "../deps.ts";
import { Screen } from "./screen.ts";

export abstract class Widget<Props> {
  focused = false;

  abstract onInput: UserInputTargets;
  abstract draw(): void;

  onFocus?(): void;
  onBlur?(): void;

  focus() {
    this.focused = true;
    this.onFocus?.();
  }
  blur() {
    this.focused = false;
    this.onBlur?.();
  }

  render() {
    this.view.shell.render();
  }

  drawAndRender() {
    this.draw();
    this.render();
  }

  onDismiss?(): void;
  dismiss() {
    this.onDismiss?.();
    this.screen?.removeWidget(this);
  }

  screen?: Screen<unknown>;

  protected constructor(public view: Box, public props: Props) {}
}
