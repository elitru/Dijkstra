"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class TestData {
    static SMALL() {
        let data;
        const vA = new Vertex(200, 200, "A", 0);
        const vB = new Vertex(500, 200, "B");
        const vC = new Vertex(800, 350, "C");
        const vD = new Vertex(200, 500, "D");
        const vE = new Vertex(500, 500, "E");
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
const pointSize = 30;
class Colors {
    static getVertexColor(state) {
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
    static getLineColor(v1, v2) {
        if ((v1.state == VertexState.ACTIVE && v2.state == VertexState.CALCULATION) ||
            (v2.state == VertexState.ACTIVE && v1.state == VertexState.CALCULATION)) {
            return this.GREEN;
        }
        if ((v1.state == VertexState.PATH_START ||
            v1.state == VertexState.PATH_BETWEEN ||
            v1.state == VertexState.PATH_END) &&
            (v2.state == VertexState.PATH_START ||
                v2.state == VertexState.PATH_BETWEEN ||
                v2.state == VertexState.PATH_END)) {
            return this.PATH_BETWEEN;
        }
        if (v1.state == VertexState.PATH_UNUSED || v2.state == VertexState.PATH_UNUSED) {
            return this.PATH_UNUSED;
        }
        return this.DEFAULT;
    }
}
Colors.DEFAULT = "#333";
Colors.GREEN = "#06c40f";
Colors.RED = "#c44506";
Colors.PATH_START = "#293241";
Colors.PATH_BETWEEN = "#3d5a80";
Colors.PATH_END = "#ee6c4d";
Colors.PATH_UNUSED = "#98c1d9";
Colors.VERTEX_TEXT_COLOR = "#fff";
Colors.LINE_TEXT_COLOR = "#222";
window.onload = () => {
    //get canvas html dom element
    const cv = (document.getElementById("graph"));
    initCanvas(cv);
    let graph = new Graph(cv, TestData.SMALL());
};
var VertexState;
(function (VertexState) {
    VertexState[VertexState["INACTIVE"] = 0] = "INACTIVE";
    VertexState[VertexState["ACTIVE"] = 1] = "ACTIVE";
    VertexState[VertexState["CALCULATION"] = 2] = "CALCULATION";
    VertexState[VertexState["PATH_START"] = 3] = "PATH_START";
    VertexState[VertexState["PATH_BETWEEN"] = 4] = "PATH_BETWEEN";
    VertexState[VertexState["PATH_END"] = 5] = "PATH_END";
    VertexState[VertexState["PATH_UNUSED"] = 6] = "PATH_UNUSED";
})(VertexState || (VertexState = {}));
class CanvasPosition {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    equals(other) {
        return this.x == other.x && this.y == other.y;
    }
}
class Vertex extends CanvasPosition {
    constructor(x, y, name, costToHere = Number.MAX_VALUE, state = VertexState.INACTIVE, neighbours = []) {
        super(x, y);
        this.previousVertex = null;
        this.name = name;
        this.costToHere = costToHere;
        this.state = state;
        this.neighbours = neighbours;
    }
    addNeighbour(node, cost) {
        this.neighbours.push(new Neighbour(cost, node));
    }
}
class Graph {
    constructor(canvas, vertices = []) {
        this.vertices = [];
        this.hasBeenCalculated = false;
        this.unvisitedVertices = [];
        this.visitedVertices = [];
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.vertices = [...vertices];
        this.unvisitedVertices = [...vertices];
        this.draw();
        this.findVertex(vertices[0], vertices[2]);
    }
    findVertex(start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.calculateDistances(start);
            yield new Promise(r => setTimeout(r, 2000));
            let path = this.getPath(end, []);
            this.colorDaWey(path);
        });
    }
    colorDaWey(path) {
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
    getPath(vertex, path) {
        if (vertex != null) {
            path.push(vertex);
            return this.getPath(vertex.previousVertex, path);
        }
        return path;
    }
    calculateDistances(start) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasBeenCalculated) {
                return;
            }
            this.hasBeenCalculated = true;
            //algorithm itself
            while (this.unvisitedVertices.length > 0) {
                this.clearVertexStates();
                //get lowest unvisited vertex
                let lowestVert = this.getLowestVertex();
                this.setVertexState(lowestVert, VertexState.ACTIVE);
                yield new Promise(r => setTimeout(r, 1000));
                //get all neighbours for vertex which haven't been visited yet
                let unvisitedNeighbours = this.getUnvisitedNeighboursForVertex(lowestVert);
                for (let neighbour of unvisitedNeighbours) {
                    //calculate cost to unvisited neighbour
                    let costToNeighbour = lowestVert.costToHere + neighbour.cost;
                    this.setVertexState(neighbour.vertex, VertexState.CALCULATION);
                    //smaller cost found --> update it's cost + previous neighbour
                    if (costToNeighbour < neighbour.vertex.costToHere) {
                        neighbour.vertex.costToHere = costToNeighbour;
                        neighbour.vertex.previousVertex = lowestVert;
                    }
                    yield new Promise(r => setTimeout(r, 1000));
                    this.setVertexState(neighbour.vertex, VertexState.INACTIVE);
                }
                //remove vertex from unvisited list
                let removedVert = this.unvisitedVertices.splice(this.unvisitedVertices.indexOf(lowestVert), 1)[0];
                this.visitedVertices.push(removedVert);
            }
            this.clearVertexStates();
            this.draw();
        });
    }
    getUnvisitedNeighboursForVertex(vertex) {
        let unvisitedNeighbours = [];
        for (let neighbour of vertex.neighbours) {
            if (containsVertex(this.unvisitedVertices, vertex)) {
                unvisitedNeighbours.push(neighbour);
            }
        }
        return unvisitedNeighbours;
    }
    getLowestVertex() {
        let lowestVert = this.unvisitedVertices[0];
        for (let i = 1; i < this.unvisitedVertices.length; i++) {
            if (this.unvisitedVertices[i].costToHere < lowestVert.costToHere) {
                lowestVert = this.unvisitedVertices[i];
            }
        }
        return lowestVert;
    }
    clearVertexStates() {
        for (let v of this.visitedVertices) {
            v.state = VertexState.INACTIVE;
        }
        for (let v of this.unvisitedVertices) {
            v.state = VertexState.INACTIVE;
        }
    }
    setVertexState(vertex, state) {
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
    draw() {
        //clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let drawnConnections = [];
        //draw connections as lines in order to display node names correctly (otherwise, they'd be covered by the lines xd)
        this.vertices.forEach((v) => {
            //get neighbours of every node
            v.neighbours.forEach((n) => {
                const nv = n.vertex;
                const line = new DrawnLine(v.x, v.y, nv.x, nv.y);
                if (!containsLine(drawnConnections, line)) {
                    // line hasn't been drawn yet --> draw it!
                    const lineColor = Colors.getLineColor(v, nv);
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
                            this.ctx.fillText(n.cost + "", v.x + (nv.x - v.x) / 2, v.y + ((nv.y - v.y) / 2 - 15));
                        }
                        else {
                            this.ctx.fillText(n.cost + "", v.x + (nv.x - v.x) / 2 + 15, v.y + ((nv.y - v.y) / 2 - 15));
                        }
                    }
                    else if (nv.y < v.y) {
                        if (nv.x != v.x) {
                            this.ctx.fillText(n.cost + "", v.x + (nv.x - v.x) / 2 + 10, v.y + ((nv.y - v.y) / 2 + 15));
                        }
                        else {
                            this.ctx.fillText(n.cost + "", v.x + (nv.x - v.x) / 2 + 25, v.y + ((nv.y - v.y) / 2 + 15));
                        }
                    }
                    else {
                        if (nv.x != v.x) {
                            this.ctx.fillText(n.cost + "", v.x + (nv.x - v.x) / 2, v.y + ((nv.y - v.y) / 2 + 23));
                        }
                        else {
                            this.ctx.fillText(n.cost + "", v.x + (nv.x - v.x) / 2 + 10, v.y + ((nv.y - v.y) / 2 + 20));
                        }
                    }
                    //... and add the current line to the already drawn lines
                    drawnConnections.push(line);
                }
            });
        });
        // draw nodes
        this.vertices.forEach((v) => {
            drawNode(v, this.ctx);
        });
    }
}
class Neighbour {
    constructor(cost, vertex) {
        this.cost = cost;
        this.vertex = vertex;
    }
}
class DrawnLine {
    constructor(xFrom, yFrom, xTo, yTo) {
        this.from = new CanvasPosition(xFrom, yFrom);
        this.to = new CanvasPosition(xTo, yTo);
    }
    equals(other) {
        return ((this.from.equals(other.from) && this.to.equals(other.to)) ||
            (this.from.equals(other.to) && this.to.equals(other.from)));
    }
}
const initCanvas = (cv) => {
    cv.width = document.body.scrollWidth;
    cv.height = document.body.scrollHeight - 104;
};
const drawNode = (vertex, ctx) => {
    ctx.font = "20px Roboto";
    ctx.beginPath();
    ctx.fillStyle = Colors.getVertexColor(vertex.state);
    ctx.arc(vertex.x, vertex.y, pointSize, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.fillStyle = Colors.VERTEX_TEXT_COLOR;
    ctx.fillText(vertex.name, vertex.x - ctx.measureText(vertex.name).width / 2, vertex.y + 7);
};
const containsLine = (arr, line) => {
    for (let item of arr) {
        if (line.equals(item)) {
            return true;
        }
    }
    return false;
};
const containsVertex = (arr, vertex) => {
    for (let item of arr) {
        if (vertex == item) {
            return true;
        }
    }
    return false;
};
