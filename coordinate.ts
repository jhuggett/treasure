export class Coordinate {
  constructor(public readonly x: number, public readonly y: number) {}

  static fromArray([x, y]: [number, number]) {
    return new Coordinate(x, y);
  }

  get asArray() {
    return [this.x, this.y];
  }

  get asString() {
    return `${this.x},${this.y}`;
  }

  static fromString(coordinateString: string) {
    const [x, y] = coordinateString.split(",").map((val) => parseInt(val));
    return new Coordinate(x, y);
  }

  sameAs(coordinate: Coordinate) {
    return this.x === coordinate.x && this.y === coordinate.y;
  }

  get adjacentCoors(): Coordinate[] {
    return [
      new Coordinate(this.x + 1, this.y),
      new Coordinate(this.x - 1, this.y),
      new Coordinate(this.x, this.y + 1),
      new Coordinate(this.x, this.y - 1),
    ];
  }

  ring(distance: number): Coordinate[] {
    const xRange = range(this.x - distance, this.x + distance);
    const yRange = range(this.y - distance, this.y + distance);
    return [
      ...xRange.map((x) => new Coordinate(x, this.y - 1)),
      ...xRange.map((x) => new Coordinate(x, this.y + 1)),
      ...yRange.map((y) => new Coordinate(this.x - 1, y)),
      ...yRange.map((y) => new Coordinate(this.x + 1, y)),
    ];
  }

  scan(distance: number): Coordinate[] {
    const xRange = range(this.x - distance, this.x + distance);
    const yRange = range(this.y - distance, this.y + distance);
    return xRange.map((x, i) => new Coordinate(x, yRange[i]));
  }

  offset(direction: CompassDirection, amount: number): Coordinate {
    switch (direction) {
      case "north":
        return new Coordinate(this.x, this.y - amount);
      case "south":
        return new Coordinate(this.x, this.y + amount);
      case "east":
        return new Coordinate(this.x + amount, this.y);
      case "west":
        return new Coordinate(this.x - amount, this.y);
    }
  }
}

const directions = ["north", "south", "east", "west"] as const;
export type CompassDirection = (typeof directions)[number];

export function getCompassDirectionsOtherThan(
  direction: CompassDirection
): Array<CompassDirection> {
  return directions.filter((val) => val != direction);
}

export function getOppositeCompassDirection(
  direction: CompassDirection
): CompassDirection {
  switch (direction) {
    case "north": {
      return "south";
    }
    case "south": {
      return "north";
    }
    case "east": {
      return "west";
    }
    case "west": {
      return "east";
    }
  }
}

export function findCoordinatesInsideRectangle(
  rectangle: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  },
  coordinates: Coordinate[]
): Coordinate[] {
  return coordinates.filter(
    (coordinate) =>
      coordinate.x >= rectangle.xMin &&
      coordinate.x <= rectangle.xMax &&
      coordinate.y >= rectangle.yMin &&
      coordinate.y <= rectangle.yMax
  );
}

// Consider using a generator instead of an array?
export function range(start: number, end: number): Array<number> {
  const numbers: number[] = [];
  for (let i = start; i <= end; i++) {
    numbers.push(i);
  }
  return numbers;
}
