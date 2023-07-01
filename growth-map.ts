import { Coordinate } from "./coordinate.ts";
import { KDTree, KDTreeInput, Random, Squirrel3 } from "./deps.ts";

export enum LandType {
  land,
  scaffold,
  coast,
  mountain,
  snowcapped,
}

export class GrowthPointData {
  coordinate: Coordinate;
  landType: LandType;

  constructor(coordinate: Coordinate, landType: LandType) {
    this.coordinate = coordinate;
    this.landType = landType;
  }
}

export class GrowthMap {
  points: Array<GrowthPointData> = [];

  growthPoints: Array<Coordinate> = [new Coordinate(0, 0)];

  tree: KDTree<GrowthPointData> = new KDTree([]);

  random: Random;

  constructor(random: Random) {
    this.random = random;
  }

  removePoint(coordinate: Coordinate) {
    this.points = this.points.filter((point) =>
      point.coordinate.sameAs(coordinate)
    );
  }

  addPoint(point: GrowthPointData) {
    this.points.push(point);
  }

  checkForPoint(coordinate: Coordinate): GrowthPointData {
    return (
      this.points.filter((point) => point.coordinate.sameAs(coordinate))[0] ||
      null
    );
  }

  grow(
    type: LandType,
    chance: number,
    callback?: (point: GrowthPointData) => void
  ): Array<Coordinate> {
    const newGrowth: Array<Coordinate> = [];

    this.growthPoints.forEach((point) => {
      const adjacentPoints = point.adjacentCoors;
      this.random.shuffle(adjacentPoints).forEach((adjacentPoint) => {
        if (!this.checkForPoint(adjacentPoint)) {
          if (newGrowth.length == 0 || this.random.getRandomBool(chance)) {
            const point = new GrowthPointData(adjacentPoint, type);
            this.addPoint(point);
            if (callback) callback(point);
            newGrowth.push(adjacentPoint);
          }
        }
      });
    });

    this.growthPoints = newGrowth;

    return newGrowth;
  }

  growToSize(size: number, callback?: (point: GrowthPointData) => void) {
    let count = 0;
    while (count < size) {
      for (let i = this.random.getRandomNumber(25, 100); i--; ) {
        if (count >= size) {
          break;
        }
        const growth = this.grow(LandType.land, 0.5, callback).length;
        if (growth == 0) {
          return;
        }
        count += growth;
      }

      for (let i = this.random.getRandomNumber(25, 100); i--; ) {
        if (count >= size) {
          break;
        }
        this.grow(LandType.scaffold, 0.5);
      }
    }
  }

  pruneScaffolding() {
    this.points = this.points.filter(
      (point) => point.landType != LandType.scaffold
    );
  }

  loadTree() {
    this.tree = new KDTree(
      this.points.map((i) => ({
        point: [i.coordinate.x, i.coordinate.y],
        value: i,
      }))
    );
  }

  identifyLandmasses() {
    const landmasses: Landmass[] = [];

    const allGatheredPoints: Set<string> = new Set();

    this.tree.all().forEach(({ value: point }) => {
      if (allGatheredPoints.has(point.coordinate.asString)) {
        return;
      }

      const gatheredPoints: Set<string> = new Set<string>();

      let pointsToCheck: Set<string> = new Set<string>();
      const nextPointsToCheck: Set<string> = new Set<string>();

      pointsToCheck.add(point.coordinate.asString);

      while (pointsToCheck.size > 0) {
        pointsToCheck.forEach((pointToCheck) => {
          gatheredPoints.add(pointToCheck);
          allGatheredPoints.add(pointToCheck);

          Coordinate.fromString(pointToCheck)
            .ring(1)
            .forEach((pointInRing) => {
              if (
                this.tree.find(pointInRing.asArray) != null &&
                !pointsToCheck.has(pointInRing.asString) &&
                !gatheredPoints.has(pointInRing.asString)
              ) {
                nextPointsToCheck.add(pointInRing.asString);
              }
            });
        });
        pointsToCheck = new Set<string>([...nextPointsToCheck]);
        nextPointsToCheck.clear();
      }

      landmasses.push(
        new Landmass(
          [...gatheredPoints].map((i) => Coordinate.fromString(i)),
          new Squirrel3(this.random.getRandomNumber(0, 1000000), 0)
        )
      );
    });

    return landmasses;
  }
}

export interface HasPoints {
  points: KDTree<LandmassPoint>;
}

export interface LandmassPoint {
  coordinate: Coordinate;
  landmass: Landmass;
  isCoastal: boolean;
  partOfCoastalRing: CostalRing | null;
  elevation: number;
  distanceToWater: number;
  distanceToMountain: number;
  landType: LandType;

  river: River | null;
}

export interface BodyOfWater extends HasPoints {}

export interface CostalRing extends HasPoints {
  isBeach: boolean;
  water: BodyOfWater | null;

  color: number;
}

export class Landmass {
  points: KDTree<LandmassPoint>;

  color: number;

  highestDistanceToWater = -1;

  constructor(points: Coordinate[], public random: Random) {
    this.color = this.random.getRandomNumber(0, 256);

    this.points = new KDTree(
      points.map((point) => ({
        point: point.asArray,
        value: {
          coordinate: point,
          landmass: this,
          isCoastal: false,
          partOfCoastalRing: null,
          elevation: 1.0,
          distanceToWater: -1,
          distanceToMountain: -1,
          landType: LandType.land,
          river: null,
        } as LandmassPoint,
      }))
    );
  }

  private costalPoints: KDTree<LandmassPoint> | undefined;

  clearCostalPoints() {
    this.costalPoints = undefined;
  }

  getCostalPoints(): KDTree<LandmassPoint> {
    if (!this.costalPoints) {
      const newCostalPoints: KDTreeInput<LandmassPoint>[] = [];
      this.points.all().forEach((point) => {
        if (
          point.value.coordinate.adjacentCoors.filter(
            (adjacentPoint) => !this.points.find(adjacentPoint.asArray)
          ).length > 0
        ) {
          point.value.isCoastal = true;
          newCostalPoints.push(point);
        }
      });
      this.costalPoints = new KDTree(newCostalPoints);
    }

    return this.costalPoints;
  }

  soften() {
    const newPoints: LandmassPoint[] = [];

    this.random.shuffle(this.getCostalPoints().all()).forEach((p) => {
      p.value.coordinate.adjacentCoors.forEach((ap) => {
        if (!this.points.find(ap.asArray)) {
          if (
            ap.ring(1).filter((rp) => this.points.find(rp.asArray)).length > 6
          ) {
            newPoints.push({
              coordinate: ap,
              isCoastal: false,
              landmass: this,
              partOfCoastalRing: null,
              elevation: 1.0,
              distanceToWater: -1,
              distanceToMountain: -1,
              landType: LandType.land,
              river: null,
            });
          }
        }
      });
    });

    this.points = new KDTree([
      ...this.points.all(),
      ...newPoints.map((i) => ({
        point: i.coordinate.asArray,
        value: i,
      })),
    ]);

    this.clearCostalPoints();
    this.clearCoastalRings();
  }

  distanceToWater() {
    if (!this.costalPoints) {
      throw new Error("distanceToWater: No costal points");
    }

    let currentDistance = 1;

    this.costalPoints.all().map((i) => (i.value.distanceToWater = 0));

    let currentSet: Set<string> = new Set(
      this.costalPoints.all().map((i) => i.value.coordinate.asString)
    );
    const nextSet: Set<string> = new Set();

    while (currentSet.size > 0) {
      currentSet.forEach((item) => {
        const coordinate = Coordinate.fromString(item);
        coordinate.adjacentCoors.forEach((adjCoor) => {
          const point = this.points.find(adjCoor.asArray);
          if (point && point.value.distanceToWater < 0) {
            point.value.distanceToWater = currentDistance;
            nextSet.add(point.value.coordinate.asString);
          }
        });
      });

      currentSet = new Set([...nextSet]);
      nextSet.clear();
      currentDistance += 1;
    }

    this.highestDistanceToWater = currentDistance - 1;
  }

  private costalRings: {
    beach: CostalRing;
    lakes: CostalRing[];
  } | null = null;

  clearCoastalRings() {
    this.costalRings = null;
  }

  getCoastalRings() {
    if (!this.costalRings) {
      const newCostalRings: CostalRing[] = [];

      this.getCostalPoints()
        .all()
        .forEach((costalPoint) => {
          if (
            newCostalRings.filter((ring) => ring.points.find(costalPoint.point))
              .length > 0
          )
            return;

          const newRingPoints: Set<LandmassPoint> = new Set();

          let current = new Set<LandmassPoint>();
          const next = new Set<LandmassPoint>();

          current.add(costalPoint.value);

          while (current.size > 0) {
            current.forEach((point) => {
              newRingPoints.add(point);
              point.coordinate
                .ring(1)
                .map((p) => this.getCostalPoints().find(p.asArray))
                .forEach((potentialPoint) => {
                  if (
                    potentialPoint &&
                    !newRingPoints.has(potentialPoint.value)
                  ) {
                    next.add(potentialPoint.value);
                  }
                });
            });

            current = new Set([...next]);
            next.clear();
          }

          newCostalRings.push({
            points: new KDTree(
              [...newRingPoints].map((i) => ({
                point: i.coordinate.asArray,
                value: i,
              }))
            ),
            water: null,
            isBeach: false,
            color: this.random.getRandomNumber(0, 256),
          });
        });

      let largestRing: CostalRing | null = null;
      let largestRingSize = 0;

      for (const ring of newCostalRings) {
        if (ring.points.all().length > largestRingSize) {
          largestRingSize = ring.points.all().length;
          largestRing = ring;
        }
      }

      if (!largestRing) {
        throw new Error("getCoastalRings: No largest ring");
      }

      largestRing.isBeach = true;

      this.costalRings = {
        beach: largestRing,
        lakes: newCostalRings.filter((i) => i != largestRing),
      };
      [this.costalRings.beach, ...this.costalRings.lakes].forEach((ring) => {
        ring.points.all().forEach((point) => {
          point.value.landType = LandType.coast;
          point.value.partOfCoastalRing = ring;
        });
      });
    }
    return this.costalRings;
  }

  mountainRanges: MountainRange[] = [];

  growMountains() {
    const distanceThreshold = 3;

    const p = this.points
      .all()
      .filter((i) => i.value.distanceToWater > distanceThreshold);

    if (p.length == 0) return;

    const fertilePoints = new KDTree(p);

    const fertileRegions: { points: KDTree<LandmassPoint> }[] = separatePoints(
      fertilePoints
    ).map((i) => ({ points: i }));

    // const mountainRanges = [];

    fertileRegions.forEach((region) => {
      let lowestLevel = 1000;
      let highestLevel = 0;

      region.points.all().forEach((point) => {
        if (point.value.distanceToWater > highestLevel)
          highestLevel = point.value.distanceToWater;
        if (point.value.distanceToWater < lowestLevel)
          lowestLevel = point.value.distanceToWater;
      });

      if (highestLevel - lowestLevel < 2) return;

      const snowCapped: KDTreeInput<LandmassPoint>[] = [];
      const regular: KDTreeInput<LandmassPoint>[] = [];

      region.points.all().forEach((point) => {
        if (point.value.distanceToWater == highestLevel) {
          point.value.landType = LandType.snowcapped;
          snowCapped.push(point);
        } else if (point.value.distanceToWater == highestLevel - 1) {
          point.value.landType = LandType.mountain;
          regular.push(point);
        }
      });

      this.mountainRanges.push({
        snowcapped: new KDTree<LandmassPoint>(snowCapped),
        regular: new KDTree<LandmassPoint>(regular),
      });
    });
  }

  rivers: River[] = [];

  findDistanceToMountains() {
    let currentDistance = 1;

    this.mountainRanges.forEach((mountain) => {
      const aggregatePoints = new Set<string>();

      currentDistance = 1;

      let curr = nextPointsSpread(
        mountain.regular
          .all()
          .map((i) => i.value)
          .map((i) => i.coordinate),
        aggregatePoints
      )
        .map((i) => this.points.find(i.asArray)?.value)
        .filter((i) => !!i) as LandmassPoint[];

      while (curr.length > 0) {
        curr.forEach((p) => {
          if (
            currentDistance < p.distanceToMountain ||
            p.distanceToMountain === -1
          ) {
            p.distanceToMountain = currentDistance;
          }
        });
        curr = nextPointsSpread(
          curr.map((i) => i.coordinate),
          aggregatePoints
        )
          .map((i) => this.points.find(i.asArray)?.value)
          .filter((i) => !!i) as LandmassPoint[];
        currentDistance++;
      }
    });
  }

  calculateElevation() {
    this.points.all().forEach((p) => {
      p.value.elevation = p.value.distanceToWater;
    });
  }

  generateRivers() {
    const allRiverPoints = new Set<string>();

    this.mountainRanges.forEach((r) => {
      const dupPoints = new Set<string>();

      const pointsAroundMountain = r.regular
        .all()
        .flatMap((i) => {
          return i.value.coordinate.adjacentCoors.map((t) => {
            const pToCheck = this.points.find(t.asArray);
            if (
              pToCheck &&
              pToCheck.value.landType == LandType.land &&
              !dupPoints.has(pToCheck.value.coordinate.asString)
            ) {
              dupPoints.add(pToCheck.value.coordinate.asString);
              return pToCheck.value;
            }
          });
        })
        .filter((i) => !!i)
        .map((i) => ({
          point: i!.coordinate.asArray,
          value: i!,
        }));

      const riverStarts: KDTreeInput<LandmassPoint>[] = [];

      const numOfRivers = this.random.getRandomNumber(3, 6);

      // need to make sure that rives can't use the same point
      // and river than hit another river needs to stop
      // and somehow render intercected rivers

      const shuffledPoints = this.random.shuffle(pointsAroundMountain);

      shuffledPoints.slice(-numOfRivers).forEach((i) => riverStarts.push(i));

      riverStarts.forEach((start) => {
        const newRiverPoints: KDTreeInput<LandmassPoint>[] = [];

        const first = start.value;
        const last = start.value;

        const riverStart = this.points.find(first.coordinate.asArray)?.value;
        const riverEnd = this.points.find(last.coordinate.asArray)?.value;

        if (!riverStart || !riverEnd) {
          throw new Error("generateRivers: No river start or end");
        }

        const newRiver = {
          start: riverStart,
          end: riverEnd,
          points: new KDTree(newRiverPoints),
          linkedPoints: [] as Linked<LandmassPoint>[],
        };

        const allPoints: LandmassPoint[] = [];

        let current = start.value;

        let hitWater = false;

        let hitRiver = false;

        while (!hitWater && !hitRiver) {
          if (allRiverPoints.has(current.coordinate.asString)) {
            hitRiver = true;
            break;
          }
          if (current.elevation === 0) hitWater = true;

          const point = this.points.find(current.coordinate.asArray);

          if (!point) {
            throw new Error("generateRivers: No point");
          }

          point.value.river = newRiver;

          allRiverPoints.add(point.value.coordinate.asString);

          allPoints.push(point.value);

          const prevPoint =
            newRiver.linkedPoints[newRiver.linkedPoints.length - 1];
          if (prevPoint) {
            const newLink = {
              previous: prevPoint,
              value: point.value,
              next: undefined,
            };
            prevPoint.next = newLink;
            newRiver.linkedPoints.push(newLink);
          } else {
            newRiver.linkedPoints.push({
              previous: this.random.getRandomItem(
                point.value.coordinate.adjacentCoors
                  .map((i) => this.points.find(i.asArray))
                  .filter((i) => i && i.value.landType == LandType.mountain)
              ).item,
              value: point.value,
              next: undefined,
            });
          }

          let lowestElevation = 99999999999; // ????

          let possibleNext: LandmassPoint[] = [];

          point.value.coordinate.adjacentCoors.forEach((i) => {
            const p = this.points.find(i.asArray);

            p && possibleNext.push(p.value);

            if (p && p.value.elevation < lowestElevation)
              lowestElevation = p.value.elevation;
          });

          possibleNext = this.random.shuffle(
            possibleNext.filter((i) => i.elevation === lowestElevation)
          );

          const next = this.random.getRandomItem(possibleNext).item;

          current = next;
        }

        const previousLast =
          newRiver.linkedPoints[newRiver.linkedPoints.length - 1];

        if (!previousLast) return;

        if (hitWater) {
          const endPoint = this.random.getRandomItem(
            newRiver.linkedPoints[
              newRiver.linkedPoints.length - 1
            ].value.coordinate.adjacentCoors.filter(
              (i) => !this.points.find(i.asArray)
            )
          ).item;

          const fakePoint: LandmassPoint = {
            coordinate: endPoint,
            distanceToMountain: 0,
            distanceToWater: 0,
            elevation: 0,
            isCoastal: false,
            landType: LandType.scaffold,
            landmass: this,
            partOfCoastalRing: null,
            river: null,
          };

          const newLast = {
            previous: previousLast,
            value: fakePoint,
            next: undefined,
          };

          previousLast.next = newLast;
        } else {
          const newLast = {
            previous: previousLast,
            value: current,
            next: undefined,
          };

          previousLast.next = newLast;
        }

        //newRiver.linkedPoints.push(newLast)

        newRiver.points = new KDTree(newRiverPoints);
        newRiver.end = this.points.find(last.coordinate.asArray)!.value;

        this.rivers.push(newRiver);
      });
    });
  }
}

interface River {
  start: LandmassPoint;
  end: LandmassPoint;
  points: KDTree<LandmassPoint>;
  linkedPoints: Linked<LandmassPoint>[];
}

interface MountainRange {
  snowcapped: KDTree<LandmassPoint>;
  regular: KDTree<LandmassPoint>;
}

interface Linked<T> {
  previous?: Linked<T>;
  value: T;
  next?: Linked<T>;
}

const nextPointsSpread = (
  currentRing: Coordinate[],
  pointsToExclude: Set<string>
) => {
  const nextRing: Coordinate[] = [];

  currentRing.forEach((point) => {
    point.adjacentCoors.forEach((adjacentCoor) => {
      if (!pointsToExclude.has(adjacentCoor.asString)) {
        nextRing.push(adjacentCoor);
        pointsToExclude.add(adjacentCoor.asString);
      }
    });
  });

  return nextRing;
};

const separatePoints = (
  points: KDTree<LandmassPoint>
): KDTree<LandmassPoint>[] => {
  const fertileRegions: KDTree<LandmassPoint>[] = [];

  const allGatheredPoints = new Set<string>();

  points.all().forEach((point) => {
    if (allGatheredPoints.has(point.value.coordinate.asString)) return;

    const gatheredPoints = new Set<string>();

    let currPoints = new Set<string>();
    const nextPoints = new Set<string>();

    currPoints.add(point.value.coordinate.asString);

    while (currPoints.size > 0) {
      currPoints.forEach((i) => {
        const pointToCheck = Coordinate.fromString(i);

        gatheredPoints.add(i);
        allGatheredPoints.add(i);

        pointToCheck.adjacentCoors
          .filter(
            (t) => !!points.find(t.asArray) && !gatheredPoints.has(t.asString)
          )
          .forEach((t) => nextPoints.add(t.asString));
      });

      currPoints = new Set<string>([...nextPoints]);
      nextPoints.clear();
    }

    fertileRegions.push(
      new KDTree(
        [...gatheredPoints].map(
          (t) => points.find(Coordinate.fromString(t).asArray)!
        )
      )
    );
  });

  return fertileRegions;
};
