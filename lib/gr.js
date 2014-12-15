
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
,   outDegree:  function () { return this.graph.outDegree(this); }
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
// note that this is a static method
// the format is detailed on toJSON()
Gr.fromJSON = function (obj) {
    if (typeof obj === "string") obj = JSON.parse(obj);
    var gr = new Gr(obj.configuration);
    // loop twice, first to create vertices, then to link them
    for (var v in obj.vertices) {
        var vertex = gr.addVertex(v.id);
        if (v.data) vertex.data = v.data;
    }
    for (var v in obj.vertices) {
        if (gr.directed) gr.link(v, v.outEdges, v.outEdgesData);
        else gr.link(v, v.edges, v.edgesData);
    }
    return gr;
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
        if (this.directed) {
            var inNeigh = keys(this._inEdges[v.id]);
            for (var i = 0, n = inNeigh.length; i < n; i++) delete this._outEdges[inNeigh[i]][v.id];
            delete this._inEdges[v.id];
            var outNeigh = keys(this._outEdges[v.id]);
            for (var i = 0, n = outNeigh.length; i < n; i++) delete this._inEdges[outNeigh[i]][v.id];
            delete this._outEdges[v.id];
        }
        else {
            var neighbours = keys(this._edges[v.id]);
            for (var i = 0, n = neighbours.length; i < n; i++) delete this._edges[neighbours[i]][v.id];
            delete this._edges[v.id];
        }
        v.destroy();
    }
,   vertices:   function () {
        return values(this._vertices);
    }
    // XXX need methods to list edges too
,   link:   function (v, neighbours, dataList) {
        if (!neighbours) return;
        if (!Array.isArray(neighbours)) neighbours = [neighbours];
        if (!neighbours.length) return;
        // if you want weights or the such, use anything truthy at the same index here
        if (!dataList) dataList = [];
        var vID = typeof v === "string" ? v : v.id;
        for (var i = 0, n = neighbours.length; i < n; i++) {
            var neighbour = typeof neighbours[i] === "string" ? neighbours[i] : neighbours[i].id
            ,   data = dataList[i] == null ? true : dataList[i]
            ;
            if (!this.loops && neighbour === v)
                throw new Error("Can't link vertex to self if graph does not accept loops.");
            if ((this.directed && this._outEdges[vID][neighbour]) ||
                 (!this.directed && this._edges[vID][neighbour]))
                throw new Error("Can't link vertices twice, graph does not accept multilinks.");
            if (this.directed) {
                this._outEdges[vID][neighbour] = data;
                this._inEdges[neighbour][vID] = data;
            }
            else {
                this._edges[vID][neighbour] = data;
                this._edges[neighbour][vID] = data;
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
    // the format for this is simple, and the same that fromJSON accepts
    // an object, with a configuration key that holds the fundamental configuration for the graph
    // a vertices key that holds all vertices by id, each of which has its basic data, edges
    // (in and out for directed graphs), and edge data
    //  configuration
    //  vertices
    //      id
    //      data
    //      edges       |
    //      edgesData   | OR
    //      outEdges
    //      outEdgesData
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
