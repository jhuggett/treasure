import { CompassDirection, Coordinate } from "../coordinate.ts";
import { SubscribableEvent } from "../subscribable-event.ts";
import { Time } from "../time.ts";
import { CoastalNode, Port } from "./map/coastal-node.ts";
import { Node } from "./node.ts";

abstract class Item {
  abstract name: string;

  inventory?: Inventory;
}

export abstract class BulkItem extends Item {
  abstract amount: number;

  add(amount: number) {
    this.amount += amount;
    this.inventory?.onChange.emit();
  }

  remove(amount: number) {
    this.amount -= amount;
    this.inventory?.onChange.emit();

    if (this.amount <= 0) {
      this.inventory?.remove(this);
    }
  }
}

export class Money extends BulkItem {
  name = "money";

  constructor(public amount: number) {
    super();
  }

  static findIn(inventory: Inventory) {
    return inventory.find(Money);
  }

  static create(amount: number) {
    return new Money(amount);
  }
}

export class Provisions extends BulkItem {
  name = "provisions";

  constructor(public amount: number) {
    super();
  }

  static findIn(inventory: Inventory) {
    return inventory.find(Provisions);
  }

  static create(amount: number) {
    return new Provisions(amount);
  }
}

export class Inventory {
  items: Item[] = [];

  onChange = new SubscribableEvent<void>();

  add(item: Item) {
    const sameKindOfItem = this.find(item.constructor as { new (): Item });
    if (sameKindOfItem && sameKindOfItem instanceof BulkItem) {
      sameKindOfItem.add((item as BulkItem).amount);
      this.onChange.emit();
      return;
    }
    item.inventory = this;
    this.items.push(item);
    this.onChange.emit();
  }

  remove(item: Item) {
    this.items = this.items.filter((i) => i !== item);

    this.onChange.emit();
  }

  // deno-lint-ignore no-explicit-any
  find<T extends Item>(itemType: { new (...args: any[]): T }) {
    return this.items.find((item) => item instanceof itemType) as T | undefined;
  }
}

export class Ship extends Node {
  move(direction: CompassDirection, time: Time) {
    const newPosition = this.currentPosition.offset(direction, 1);

    const collidedNode = this.manager?.checkCollision(newPosition);
    if (collidedNode) {
      if (collidedNode instanceof CoastalNode && collidedNode.port) {
        this.onCollisionWithPort.emit(collidedNode.port);
      }

      return;
    }

    const viewDistance = 3;

    this.manager
      ?.nodesWithin(
        new Coordinate(
          newPosition.x - viewDistance,
          newPosition.y - viewDistance
        ),
        new Coordinate(
          newPosition.x + viewDistance,
          newPosition.y + viewDistance
        )
      )
      .forEach((node) => {
        node.seen = true;
      });

    this.lastDirection = direction;

    this.setPosition(newPosition);

    time.moveTimeForwardBy(this.timePerMove());
  }

  onCollisionWithPort = new SubscribableEvent<Port>();

  timePerMove() {
    return 1;
  }

  provisionsConsumedPerDay() {
    return 1;
  }

  inventory = new Inventory();

  lastDirection?: CompassDirection;

  sprite(brightness = 1) {
    return [
      {
        character: "█",
        foregroundColor: {
          r: 255 * brightness,
          g: 255 * brightness,
          b: 255 * brightness,
        },
      },
      {
        character: "█",
        foregroundColor: {
          r: 255 * brightness,
          g: 255 * brightness,
          b: 255 * brightness,
        },
      },
    ];
  }
}
