
/*
    The odds are that this representation is all kinds of wrong, but one has to make one's own
    mistakes in order to learn.
    We deliberately not support multilinks, at least for now.
*/

var shortid = require("shortid")
,   keys = Object.keys
,   values = function (obj) {
        return keys(obj).map(function (k) { return obj[k]; });
    }
;

function Vertex (options) {
    this.id = options.id;
    this.graph = options.graph;
    this.data = {}; // for arbitrary content
}
Vertex.prototype = {
    destroy:    function () {
        this.graph = null; // just avoiding memory cycles
        this.data = null;
    }
,   degree:     function () { return this.graph.degree(this); }
,   outDdegree: function () { return this.graph.outDdegree(this); }
,   inDegree:   function () { return this.graph.inDegree(this); }
,   toJSON: function () {
        return { id: this.id, data: this.data };
    }
};

function Gr (options) {
    if (!options) options = {};
    this.directed = !!options.directed;
    this.loops = !!options.loops;
    this._vertices = {};
    if (this.directed) {
        this._outEdges = {};
        this._inEdges = {};
    }
    else {
        this._edges = {};
    }
}
Gr.fromJSON = function (obj) {
    if (typeof obj === "string") obj = JSON.parse(obj);
    // XXX read configuration, vertices, etc.
};
Gr.prototype = {
    addVertex:  function (id) {
        var v = new Vertex({
            id:     id || shortid.generate()
        ,   graph:  this
        });
        if (this._vertices[v.id]) throw new Error("A vertex with ID=" + v.id + " is already present in the graph.");
        this._vertices[v.id] = v;
        if (this.directed) {
            this._outEdges[v.id] = {};
            this._inEdges[v.id] = {};
        }
        else {
            this._edges[v.id] = {};
        }
        return v;
    }
,   dropVertex: function (v) {
        delete this._vertices[v.id];
        v.destroy();
    }
,   vertices:   function () {
        return values(this._vertices);
    }
,   link:   function (v, neighbours, data) {
        if (!neighbours) return;
        if (!Array.isArray(neighbours)) neighbours = [neighbours];
        if (!neighbours.length) return;
        if (!data) data = true; // if you want weights or the such, use anything truthy here
        for (var i = 0, n = neighbours.length; i < n; i++) {
            var neighbour = neighbours[i];
            if (!this.loops && neighbour === v)
                throw new Error("Can't link vertex to self if graph does not accept loops.");
            if ((this.directed && this._outEdges[v.id][neighbour.id]) ||
                 (!this.directed && this._edges[v.id][neighbour.id]))
                throw new Error("Can't link vertices twice, graph does not accept multilinks.");
            if (this.directed) {
                this._outEdges[v.id][neighbour.id] = data;
                this._inEdges[neighbour.id][v.id] = data;
            }
            else {
                this._edges[v.id][neighbour.id] = data;
                this._edges[neighbour.id][v.id] = data;
            }
        }
    }
,   degree: function (v) {
        if (this.directed) throw new Error("For directed graphs, use in/outDegree().");
        return keys(this._edges[v.id]).length;
    }
,   outDegree: function (v) {
        if (!this.directed) throw new Error("For undirected graphs, use degree().");
        return keys(this._outEdges[v.id]).length;
    }
,   inDegree: function (v) {
        if (!this.directed) throw new Error("For undirected graphs, use degree().");
        return keys(this._inEdges[v.id]).length;
    }
    // the sum of the degrees is twice the number of edges
    // it so happens that we already account for them twice in undirected graphs
,   sumDegrees: function () {
        if (this.directed) return 2 * keys(this._inEdges).length;
        else return keys(this._edges);
    }
,   toJSON: function () {
        var obj = {
                configuration:  {
                    directed:   this.directed
                ,   loops:      this.loops
                }
            ,   vertices:   {}
            }
        ,   vertices = this.vertices()
        ;
        for (var i = 0, n = vertices.length; i < n; i++) {
            var v = vertices[i].toJSON();
            obj.vertices[v.id] = v;
            if (this.directed) {
                obj.vertices[v.id].outEdges = keys(this._outEdges[v.id]);
                obj.vertices[v.id].outEdgesData = values(this._outEdges[v.id]);
                obj.vertices[v.id].inEdges = keys(this._inEdges[v.id]);
                obj.vertices[v.id].inEdgesData = values(this._inEdges[v.id]);
            }
            else {
                obj.vertices[v.id].edges = keys(this._edges[v.id]);
                obj.vertices[v.id].edgesData = values(this._edges[v.id]);
            }
        }
        return obj;
    }
};

module.exports = Gr;
