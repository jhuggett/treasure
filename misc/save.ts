import { Squirrel3 } from "../deps.ts";
import { Player } from "./player.ts";
import { Time } from "./time.ts";
import { WorldMap } from "./world-map.ts";

export class Save {
  constructor(public name: string) {}

  save() {
    throw new Error("Not implemented.");
  }

  load() {
    throw new Error("Not implemented.");
  }

  static new() {
    const save = new Save("Player 1");

    const player = new Player();

    const worldMap = new WorldMap();

    const time = new Time(0);

    save.player = player;
    save.worldMap = worldMap;
    save.time = time;

    return save;
  }

  time?: Time;
  worldMap?: WorldMap;
  player?: Player;

  random = new Squirrel3(0, 0);
}
