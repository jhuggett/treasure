import { UserInputTargets, TargetMap, userInput } from "../deps.ts";
import { AppManager } from "./app-manager.ts";
import { Widget } from "./widget.ts";

export abstract class Screen<Props> {
  private widgets: Widget<unknown>[] = [];

  addWidget(widget: Widget<unknown>, options?: { focus?: boolean }) {
    widget.screen = this;
    this.widgets.push(widget);
    if (
      options?.focus !== false &&
      (this.widgets.length === 1 || options?.focus)
    ) {
      this.focusOn(widget);
    }
  }

  removeWidget(widget: Widget<unknown>) {
    this.widgets = this.widgets.filter((w) => w !== widget);
    this.focusHistory = this.focusHistory.filter((w) => w !== widget);
    if (widget.focused) {
      this.focusOn(this.focusHistory[this.focusHistory.length - 1]);
    }
  }

  frozen = true;

  protected constructor(public appManager: AppManager, public props: Props) {}

  onPopped?(): void;
  onPoppedTo?(): void;
  onPushed?(): void;

  pop() {
    this.appManager.pop();
  }

  // frozenGrid?: PointGrid;
  // freeze(shell: Shell) {
  //   this.frozenGrid = shell.copyPointGrid();
  //   this.frozen = true;
  // }

  // unfreeze(shell: Shell) {
  //   if (!this.frozen || !this.frozenGrid) return;
  //   shell.loadPointGrid(this.frozenGrid);
  //   this.frozen = false;
  //   this.onUnfrozen?.();
  // }

  // onUnfrozen?(): void;

  protected abstract onInput: UserInputTargets;

  async userInteractions() {
    const screenTargetMap = new TargetMap(this.onInput);
    const focusedWidgetTargetMap =
      this.focusedWidget && new TargetMap(this.focusedWidget.onInput);
    if (focusedWidgetTargetMap) {
      focusedWidgetTargetMap.merge(screenTargetMap);
    }
    await userInput(
      this.appManager.shell,
      focusedWidgetTargetMap || screenTargetMap
    );
  }

  focusHistory: Widget<unknown>[] = [];

  focusedWidget?: Widget<unknown>;

  focusOn(widget: Widget<unknown>) {
    if (this.focusedWidget) {
      this.focusedWidget.blur();
    }
    this.focusedWidget = widget;
    this.focusedWidget.focus();
    this.focusHistory.push(widget);
  }

  draw() {
    this.widgets.forEach((widget) => {
      widget.draw();
    });
  }

  render() {
    this.appManager.shell.render();
  }

  drawAndRender() {
    this.draw();
    this.render();
  }
}
