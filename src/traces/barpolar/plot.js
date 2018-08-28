/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var helpers = require('../../plots/polar/helpers');

module.exports = function plot(gd, subplot, cdbar) {
    var xa = subplot.xaxis;
    var ya = subplot.yaxis;
    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;
    var pathFn = makePathFn(subplot);
    var barLayer = subplot.layers.frontplot.select('g.barlayer');

    Lib.makeTraceGroups(barLayer, cdbar, 'trace bars').each(function(cd) {
        var cd0 = cd[0];
        var plotGroup = cd0.node3 = d3.select(this);
        var t = cd0.t;

        var poffset = t.poffset;
        var poffsetIsArray = Array.isArray(poffset);

        var pointGroup = Lib.ensureSingle(plotGroup, 'g', 'points');
        var bars = pointGroup.selectAll('g.point').data(Lib.identity);

        bars.enter().append('g')
            .classed('point', true);

        bars.exit().remove();

        bars.each(function(di, i) {
            var bar = d3.select(this);

            // TODO move this block to Bar.setPositions?
            //
            // now display the bar
            // clipped xf/yf (2nd arg true): non-positive
            // log values go off-screen by plotwidth
            // so you see them continue if you drag the plot
            //
            // this gets reused in ./hover.js
            var p0 = di.p0 = di.p + ((poffsetIsArray) ? poffset[i] : poffset);
            var p1 = di.p1 = p0 + di.w;
            var s0 = di.s0 = di.b;
            var s1 = di.s1 = s0 + di.s;

            var rp0 = di.rp0 = radialAxis.c2p(s0);
            var rp1 = di.rp1 = radialAxis.c2p(s1);
            var thetag0 = di.thetag0 = angularAxis.c2g(p0);
            var thetag1 = di.thetag1 = angularAxis.c2g(p1);

            var dPath;

            if(!isNumeric(rp0) || !isNumeric(rp1) ||
                !isNumeric(thetag0) || !isNumeric(thetag1) ||
                rp0 === rp1 || thetag0 === thetag1
            ) {
                // do not remove blank bars, to keep data-to-node
                // mapping intact during radial drag, that we
                // can skip calling _module.style during interactions
                dPath = 'M0,0Z';
            } else {
                // TODO is this where we want for to select for barpolar?
                var rg1 = radialAxis.c2g(s1);
                var thetagMid = (thetag0 + thetag1) / 2;
                di.ct = [
                    xa.c2p(rg1 * Math.cos(thetagMid)),
                    ya.c2p(rg1 * Math.sin(thetagMid))
                ];

                // TODO round up bar borders?
                // if so, factor out that logic from Bar.plot

                dPath = pathFn(rp0, rp1, thetag0, thetag1);
            }

            Lib.ensureSingle(bar, 'path')
                .style('vector-effect', 'non-scaling-stroke')
                .attr('d', dPath);
        });

        // clip plotGroup, when trace layer isn't clipped
        Drawing.setClipUrl(plotGroup, subplot._hasClipOnAxisFalse ? subplot.clipIds.forTraces : null);
    });
};

function makePathFn(subplot) {
    var cxx = subplot.cxx;
    var cyy = subplot.cyy;

    if(subplot.vangles) {
        return function(r0, r1, _a0, _a1) {
            var a0, a1;

            if(Lib.angleDelta(_a0, _a1) > 0) {
                a0 = _a0;
                a1 = _a1;
            } else {
                a0 = _a1;
                a1 = _a0;
            }

            var tip = (a0 + a1) / 2;
            var va0 = helpers.findEnclosingVertexAngles(a0, subplot.vangles)[0];
            var va1 = helpers.findEnclosingVertexAngles(a1, subplot.vangles)[1];
            var vaBar = [va0, tip, va1];
            var clip = [a0, a1].map(Lib.rad2deg);

            return helpers.pathPolygonAnnulus(r0, r1, clip, vaBar, cxx, cyy);
        };
    }

    return function(r0, r1, a0, a1) {
        return Lib.pathAnnulus(r0, r1, a0, a1, cxx, cyy);
    };
}
