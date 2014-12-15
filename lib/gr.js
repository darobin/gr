
/*
    The odds are that this representation is all kinds of wrong, but one has to make one's own
    mistakes in order to learn.
*/

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
};

function Gr (options) {
    if (!options) options = {};
    this.directed = !!options.directed;
    this.multilinks = !!options.multilink;
    this.loops = !!options.loops;
    this._vertices = {};
    this._id = 1;
    if (this.directed) {
        this._outEdges = {};
        this._inEdges = {};
    }
    else {
        this._edges = {};
    }
}
Gr.prototype = {
    addVertex:  function (id) {
        var v = new Vertex({
            id:     id || this.id++
        ,   graph:  this
        });
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
,   link:   function (v, neighbours, data) {
        if (!neighbours || !neighbours.length) return;
        if (!data) data = true; // if you want weights or the such, use anything truthy here
        for (var i = 0, n = neighbours.length; i < n; i++) {
            var neighbour = neighbours[i];
            if (!this.loop && neighbour === v)
                throw new Error("Can't link vertex to self if graph does not accept loops.");
            if (!this.multilinks &&
                ((this.directed && this._outEdges[v.id][neighbour.id]) ||
                 (!this.directed && this._edges[v.id][neighbour.id])
                ))
                throw new Error("Can't link vertices twice if graph does not accept multilinks.");
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
        return Object.keys(this._edges[v.id]).length;
    }
,   outDegree: function (v) {
        if (!this.directed) throw new Error("For undirected graphs, use degree().");
        return Object.keys(this._outEdges[v.id]).length;
    }
,   inDegree: function (v) {
        if (!this.directed) throw new Error("For undirected graphs, use degree().");
        return Object.keys(this._inEdges[v.id]).length;
    }
};

module.exports = Gr;
