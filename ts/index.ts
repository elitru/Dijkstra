class TestData {
  public static SMALL(): Vertex[] {
    let data: Vertex[];

    const vA: Vertex = new Vertex(200, 200, "A", 0);
    const vB: Vertex = new Vertex(500, 200, "B");
    const vC: Vertex = new Vertex(800, 350, "C");
    const vD: Vertex = new Vertex(200, 500, "D");
    const vE: Vertex = new Vertex(500, 500, "E");

    vA.addNeighbour(vD, 1);
    vA.addNeighbour(vB, 6);

    vB.addNeighbour(vA, 6);
    vB.addNeighbour(vD, 2);
    vB.addNeighbour(vE, 2);
    vB.addNeighbour(vC, 5);

    vC.addNeighbour(vB, 5);
    vC.addNeighbour(vE, 5);

    vD.addNeighbour(vA, 1);
    vD.addNeighbour(vB, 2);
    vD.addNeighbour(vE, 1);

    vE.addNeighbour(vD, 1);
    vE.addNeighbour(vB, 2);
    vE.addNeighbour(vC, 5);

    data = [vA, vB, vC, vD, vE];

    return data;
  }
}

const pointSize: number = 30;

class Colors {
  private static readonly DEFAULT: string = "#333";
  private static readonly GREEN: string = "#06c40f";
  private static readonly RED: string = "#c44506";
  private static readonly PATH_START: string = "#293241";
  private static readonly PATH_BETWEEN: string = "#3d5a80";
  private static readonly PATH_END: string = "#ee6c4d";
  private static readonly PATH_UNUSED: string = "#98c1d9";

  public static readonly VERTEX_TEXT_COLOR: string = "#fff";
  public static readonly LINE_TEXT_COLOR: string = "#222";

  public static getVertexColor(state: VertexState): string {
    switch (state) {
      case VertexState.ACTIVE:
        return this.RED;

      case VertexState.CALCULATION:
        return this.GREEN;

      case VertexState.PATH_START:
        return this.PATH_START;

      case VertexState.PATH_BETWEEN:
        return this.PATH_BETWEEN;

      case VertexState.PATH_END:
        return this.PATH_END;

      case VertexState.PATH_UNUSED:
        return this.PATH_UNUSED;

      default:
        return this.DEFAULT;
    }
  }

  public static getLineColor(v1: Vertex, v2: Vertex): string {
    if (
      (v1.state == VertexState.ACTIVE && v2.state == VertexState.CALCULATION) ||
      (v2.state == VertexState.ACTIVE && v1.state == VertexState.CALCULATION)
    ) {
      return this.GREEN;
    }

    if (
      (v1.state == VertexState.PATH_START ||
        v1.state == VertexState.PATH_BETWEEN ||
        v1.state == VertexState.PATH_END) &&
      (v2.state == VertexState.PATH_START ||
        v2.state == VertexState.PATH_BETWEEN ||
        v2.state == VertexState.PATH_END)
    ) {
      return this.PATH_BETWEEN;
    }

    if(v1.state == VertexState.PATH_UNUSED || v2.state == VertexState.PATH_UNUSED){
        return this.PATH_UNUSED;
    }

    return this.DEFAULT;
  }
}

window.onload = () => {
  //get canvas html dom element
  const cv: HTMLCanvasElement | null = <HTMLCanvasElement>(
    document.getElementById("graph")
  );

  initCanvas(cv);

  let graph: Graph = new Graph(cv, TestData.SMALL());
};

enum VertexState {
  INACTIVE = 0,
  ACTIVE = 1,
  CALCULATION = 2,
  PATH_START = 3,
  PATH_BETWEEN = 4,
  PATH_END = 5,
  PATH_UNUSED = 6
}

class CanvasPosition {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public equals(other: CanvasPosition): boolean {
    return this.x == other.x && this.y == other.y;
  }
}

class Vertex extends CanvasPosition {
  public name: string;
  public neighbours: Neighbour[];
  public costToHere: number;
  public previousVertex: Vertex | null = null;
  public state: VertexState;

  constructor(
    x: number,
    y: number,
    name: string,
    costToHere: number = Number.MAX_VALUE,
    state: VertexState = VertexState.INACTIVE,
    neighbours: Neighbour[] = []
  ) {
    super(x, y);
    this.name = name;
    this.costToHere = costToHere;
    this.state = state;
    this.neighbours = neighbours;
  }

  public addNeighbour(node: Vertex, cost: number): void {
    this.neighbours.push(new Neighbour(cost, node));
  }
}

class Graph {
  public canvas: HTMLCanvasElement;
  public vertices: Vertex[] = [];
  private ctx: CanvasRenderingContext2D;
  private hasBeenCalculated: boolean = false;
  private unvisitedVertices: Vertex[] = [];
  private visitedVertices: Vertex[] = [];

  constructor(canvas: HTMLCanvasElement, vertices: Vertex[] = []) {
    this.canvas = canvas;
    this.ctx = <CanvasRenderingContext2D>canvas.getContext("2d");

    this.vertices = [...vertices];
    this.unvisitedVertices = [...vertices];

    this.draw();

    this.findVertex(vertices[0], vertices[2]);
  }

  public async findVertex(start: Vertex, end: Vertex): Promise<void> {
    await this.calculateDistances(start);
    await new Promise(r => setTimeout(r, 2000));
    let path: Vertex[] = this.getPath(end, []);
    this.colorDaWey(path);
  }

  private colorDaWey(path: Vertex[]): void {
    for (let vert of this.visitedVertices) {
      vert.state = VertexState.PATH_UNUSED;
    }

    path[0].state = VertexState.PATH_END;
    path[path.length - 1].state = VertexState.PATH_START;

    for (let i = 1; i < path.length - 1; i++) {
      path[i].state = VertexState.PATH_BETWEEN;
    }

    this.draw();
  }

  public getPath(vertex: Vertex | null, path: Vertex[]): Vertex[] {
    if (vertex != null) {
      path.push(vertex);
      return this.getPath(vertex.previousVertex, path);
    }

    return path;
  }

  private async calculateDistances(start: Vertex): Promise<void> {
    if (this.hasBeenCalculated) {
      return;
    }

    this.hasBeenCalculated = true;

    //algorithm itself

    while (this.unvisitedVertices.length > 0) {
      this.clearVertexStates();
      //get lowest unvisited vertex
      let lowestVert: Vertex = this.getLowestVertex();
      this.setVertexState(lowestVert, VertexState.ACTIVE);

      await new Promise(r => setTimeout(r, 1000));

      //get all neighbours for vertex which haven't been visited yet
      let unvisitedNeighbours: Neighbour[] = this.getUnvisitedNeighboursForVertex(
        lowestVert
      );

      for (let neighbour of unvisitedNeighbours) {
        //calculate cost to unvisited neighbour
        let costToNeighbour: number = lowestVert.costToHere + neighbour.cost;

        this.setVertexState(neighbour.vertex, VertexState.CALCULATION);

        //smaller cost found --> update it's cost + previous neighbour
        if (costToNeighbour < neighbour.vertex.costToHere) {
          neighbour.vertex.costToHere = costToNeighbour;
          neighbour.vertex.previousVertex = lowestVert;
        }

        await new Promise(r => setTimeout(r, 1000));

        this.setVertexState(neighbour.vertex, VertexState.INACTIVE);
      }

      //remove vertex from unvisited list
      let removedVert: Vertex = this.unvisitedVertices.splice(
        this.unvisitedVertices.indexOf(lowestVert),
        1
      )[0];
      this.visitedVertices.push(removedVert);
    }

    this.clearVertexStates();
    this.draw();
  }

  private getUnvisitedNeighboursForVertex(vertex: Vertex): Neighbour[] {
    let unvisitedNeighbours: Neighbour[] = [];

    for (let neighbour of vertex.neighbours) {
      if (containsVertex(this.unvisitedVertices, vertex)) {
        unvisitedNeighbours.push(neighbour);
      }
    }

    return unvisitedNeighbours;
  }

  private getLowestVertex(): Vertex {
    let lowestVert: Vertex = this.unvisitedVertices[0];

    for (let i = 1; i < this.unvisitedVertices.length; i++) {
      if (this.unvisitedVertices[i].costToHere < lowestVert.costToHere) {
        lowestVert = this.unvisitedVertices[i];
      }
    }

    return lowestVert;
  }

  private clearVertexStates(): void {
    for (let v of this.visitedVertices) {
      v.state = VertexState.INACTIVE;
    }
    for (let v of this.unvisitedVertices) {
      v.state = VertexState.INACTIVE;
    }
  }

  private setVertexState(vertex: Vertex, state: VertexState): void {
    for (let v of this.unvisitedVertices) {
      if (v == vertex) {
        v.state = state;
      }
    }

    for (let v of this.visitedVertices) {
      if (v == vertex) {
        v.state = state;
      }
    }

    this.draw();
  }

  public draw(): void {
    //clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let drawnConnections: DrawnLine[] = [];
    //draw connections as lines in order to display node names correctly (otherwise, they'd be covered by the lines xd)
    this.vertices.forEach((v: Vertex) => {
      //get neighbours of every node
      v.neighbours.forEach((n: Neighbour) => {
        const nv: Vertex = n.vertex;
        const line: DrawnLine = new DrawnLine(v.x, v.y, nv.x, nv.y);

        if (!containsLine(drawnConnections, line)) {
          // line hasn't been drawn yet --> draw it!
          const lineColor: string = Colors.getLineColor(v, nv);
          this.ctx.lineWidth = 8;
          this.ctx.fillStyle = lineColor;
          this.ctx.strokeStyle = lineColor;
          this.ctx.beginPath();
          this.ctx.moveTo(v.x, v.y);
          this.ctx.lineTo(nv.x, nv.y);
          this.ctx.stroke();

          //display text
          this.ctx.font = "18px Roboto";
          this.ctx.beginPath();
          this.ctx.fillStyle = Colors.LINE_TEXT_COLOR;

          if (nv.y > v.y) {
            if (nv.x != v.x) {
              this.ctx.fillText(
                n.cost + "",
                v.x + (nv.x - v.x) / 2,
                v.y + ((nv.y - v.y) / 2 - 15)
              );
            } else {
              this.ctx.fillText(
                n.cost + "",
                v.x + (nv.x - v.x) / 2 + 15,
                v.y + ((nv.y - v.y) / 2 - 15)
              );
            }
          } else if (nv.y < v.y) {
            if (nv.x != v.x) {
              this.ctx.fillText(
                n.cost + "",
                v.x + (nv.x - v.x) / 2 + 10,
                v.y + ((nv.y - v.y) / 2 + 15)
              );
            } else {
              this.ctx.fillText(
                n.cost + "",
                v.x + (nv.x - v.x) / 2 + 25,
                v.y + ((nv.y - v.y) / 2 + 15)
              );
            }
          } else {
            if (nv.x != v.x) {
              this.ctx.fillText(
                n.cost + "",
                v.x + (nv.x - v.x) / 2,
                v.y + ((nv.y - v.y) / 2 + 23)
              );
            } else {
              this.ctx.fillText(
                n.cost + "",
                v.x + (nv.x - v.x) / 2 + 10,
                v.y + ((nv.y - v.y) / 2 + 20)
              );
            }
          }

          //... and add the current line to the already drawn lines
          drawnConnections.push(line);
        }
      });
    });

    // draw nodes
    this.vertices.forEach((v: Vertex) => {
      drawNode(v, this.ctx);
    });
  }
}

class Neighbour {
  public cost: number;
  public vertex: Vertex;

  constructor(cost: number, vertex: Vertex) {
    this.cost = cost;
    this.vertex = vertex;
  }
}

class DrawnLine {
  public from: CanvasPosition;
  public to: CanvasPosition;

  constructor(xFrom: number, yFrom: number, xTo: number, yTo: number) {
    this.from = new CanvasPosition(xFrom, yFrom);
    this.to = new CanvasPosition(xTo, yTo);
  }

  public equals(other: DrawnLine): boolean {
    return (
      (this.from.equals(other.from) && this.to.equals(other.to)) ||
      (this.from.equals(other.to) && this.to.equals(other.from))
    );
  }
}

const initCanvas = (cv: HTMLCanvasElement): void => {
  cv.width = document.body.scrollWidth;
  cv.height = document.body.scrollHeight - 104;
};

const drawNode = (vertex: Vertex, ctx: CanvasRenderingContext2D): void => {
  ctx.font = "20px Roboto";
  ctx.beginPath();
  ctx.fillStyle = Colors.getVertexColor(vertex.state);
  ctx.arc(vertex.x, vertex.y, pointSize, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.fillStyle = Colors.VERTEX_TEXT_COLOR;
  ctx.fillText(
    vertex.name,
    vertex.x - ctx.measureText(vertex.name).width / 2,
    vertex.y + 7
  );
};

const containsLine = (arr: DrawnLine[], line: DrawnLine): boolean => {
  for (let item of arr) {
    if (line.equals(item)) {
      return true;
    }
  }
  return false;
};

const containsVertex = (arr: Vertex[], vertex: Vertex): boolean => {
  for (let item of arr) {
    if (vertex == item) {
      return true;
    }
  }
  return false;
};
