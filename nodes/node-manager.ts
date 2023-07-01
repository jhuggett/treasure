import { Camera } from "../camera.ts";
import { Coordinate } from "../coordinate.ts";
import { KDTree } from "../deps.ts";
import { Node } from "./node.ts";

export class NodeManager {
  /*
  Todo: 
    - Node movement optimization. Say if a node is immoveable, seldom, or often.
      Dictates storage strategies for said node.
    - Collision groups. Allow nodes to be part of groups so that when one node
      is collided with, a group level collision event can be emitted.
  */

  private tree: KDTree<Node>;
  private nodes: Node[];
  constructor() {
    this.tree = new KDTree([]);
    this.nodes = [];
  }
  addNode(node: Node) {
    this.nodes.push(node);
    this.tree.add({ point: node.currentPosition.asArray, value: node });
    node.assignManager(this);
    this.onChange?.();
  }

  bulkAddNodes(nodes: Node[]) {
    this.nodes.push(...nodes);
    this.rebalance();
    nodes.forEach((node) => node.assignManager(this));
    this.onChange?.();
  }

  rebalance() {
    this.tree = new KDTree(
      this.nodes.map((node) => ({
        point: node.currentPosition.asArray,
        value: node,
      }))
    );
  }

  onNodeMoved() {
    /*
      Crudely rebuild the tree. This is not optimal, but it works for now.
    */
    this.rebalance();
    this.onChange?.();
  }

  // NEED TO SET UP A DEBUG WINDOW.

  checkCollision(coordinate: Coordinate) {
    return this.tree.find(coordinate.asArray);
  }

  nodesWithin(start: Coordinate, end: Coordinate) {
    const nodes = this.tree.range(start.asArray, end.asArray);
    return nodes.map((node) => node.value);
  }

  onChange?: () => void;

  nodesInCameraView(camera: Camera) {
    const start = camera.position;
    const end = new Coordinate(
      start.x + camera.width / 2 - 1,
      start.y + camera.height - 1
    );

    return this.nodesWithin(start, end);
  }
}
