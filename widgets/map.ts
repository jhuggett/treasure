import { portion } from "../../terminal/mod.ts";
import { Box, UserInputTargets } from "../deps.ts";
import { Widget } from "../framework/widget.ts";
import { Camera } from "../misc/camera.ts";
import { Coordinate } from "../misc/coordinate.ts";
import { Time } from "../misc/time.ts";
import { NodeManager } from "../nodes/node-manager.ts";
import { Ship } from "../nodes/ship-node.ts";

export type MapWidgetProps = {
  nodeManager: NodeManager;
  ship: Ship;
  time: Time;
};

export class MapWidget extends Widget<MapWidgetProps> {
  camera: Camera;

  backgroundView: Box;
  nodeView: Box;

  private constructor(view: Box, props: MapWidgetProps) {
    super(view, props);

    this.backgroundView = this.view.layer({
      ...portion.full(),
    });
    this.nodeView = this.view.layer({
      ...portion.full(),
    });

    const camera = new Camera({
      getHeight: () => this.nodeView.height,
      getWidth: () => this.nodeView.width,
      position: new Coordinate(0, 0),
    });

    props.ship.onPositionChange.subscribe(() => {
      camera.centerOnNode(props.ship);
    });

    camera.onMove = () => {
      this.drawAndRender();
    };

    this.camera = camera;

    camera.centerOnNode(props.ship);
  }

  static create(view: Box, props: MapWidgetProps) {
    const widget = new MapWidget(view, props);

    return widget;
  }

  onFocus() {
    this.drawAndRender();
  }
  onBlur() {
    this.drawAndRender();
  }

  _bg_was_focused?: boolean;
  draw() {
    this.nodeView.clear();

    if (this.focused && this._bg_was_focused !== true) {
      this.backgroundView.fill({
        character: " ",
        backgroundColor: { r: 0, g: 0, b: 175 },
      });
      this._bg_was_focused = true;
    } else if (!this.focused && this._bg_was_focused !== false) {
      this.backgroundView.fill({
        character: " ",
        backgroundColor: { r: 0, g: 0, b: 175 * 0.5 },
      });
      this._bg_was_focused = false;
    }

    this.props.nodeManager.nodesInCameraView(this.camera).forEach((node) => {
      //if (!node.seen) return;
      this.nodeView.moveCursorTo({
        x: (node.currentPosition.x - this.camera.position.x) * 2,
        y: node.currentPosition.y - this.camera.position.y,
      });
      node.sprite(this.focused ? 1 : 0.5).forEach((point) => {
        this.nodeView.bufferedWriteCharacter(point);
      });
    });

    //displayInfo();
  }

  onInput: UserInputTargets = {
    "Arrow Up": () => {
      this.props.ship.move("north", this.props.time);
    },
    "Arrow Down": () => {
      this.props.ship.move("south", this.props.time);
    },
    "Arrow Left": () => {
      this.props.ship.move("west", this.props.time);
    },
    "Arrow Right": () => {
      this.props.ship.move("east", this.props.time);
    },
  };
}
