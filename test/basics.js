/*jshint -W079 */

var Gr = require("..")
,   expect = require("expect.js")
;


describe("Basics", function () {
    describe("Directed", function () {
        it("should create basic vertices", function () {
            var gr = new Gr()
            ,   v1 = gr.addVertex()
            ,   v2 = gr.addVertex()
            ,   vNamed = gr.addVertex("foo")
            ;
            expect(v1).to.be.ok;
            expect(v1.id).to.be.ok;
            expect(v1.id).to.not.equal(v2.id);
            expect(v1.id).to.not.equal(vNamed.id);
            expect(vNamed.id).to.equal("foo");
            expect(function () { gr.addVertex("foo"); })
                .to.throwError(/already present in the graph/);
            expect(gr.vertices()).to.have.length(3);
        });
        it("should enforce constraints", function () {
            var basic = new Gr()
            ,   loopy = new Gr({ loops: true })
            ;
            // basic: no loops, no multi
            var v1 = basic.addVertex()
            ,   v2 = basic.addVertex()
            ;
            expect(function () { basic.link(v1, v1); })
                .to.throwError(/link vertex to self if graph does not accept loops/);
            expect(function () { basic.link(v1, v2); basic.link(v1, v2); })
                .to.throwError(/link vertices twice, graph does not accept multilinks/);
            
            // loops
            var v1 = loopy.addVertex()
            ,   v2 = loopy.addVertex()
            ;
            expect(function () { loopy.link(v1, v1); })
                .to.not.throwError();
            expect(function () { loopy.link(v1, v2); loopy.link(v1, v2); })
                .to.throwError(/link vertices twice, graph does not accept multilinks/);
        });
    });
    // XXX
    //  from/toJSON
    //  undirected
    //  dropVertex()
    //  vertices()
    //  degree methods
    //  sumDegrees
});
