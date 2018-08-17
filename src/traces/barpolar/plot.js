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
var tinycolor = require('tinycolor2');

var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');

var Color = require('../../components/color');
var Drawing = require('../../components/drawing');

module.exports = function plot(gd, subplot, cdbar) {
    var fullLayout = gd._fullLayout;
    var xa = subplot.xaxis;
    var ya = subplot.yaxis;
    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;
    var barLayer = subplot.layers.frontplot.select('g.barlayer');

    Lib.makeTraceGroups(barLayer, cdbar, 'trace bars').each(function(cd) {
        var cd0 = cd[0];
        var plotGroup = cd0.node3 = d3.select(this);
        var t = cd0.t;
        var trace = cd0.trace;

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
            var p0 = di.p + ((poffsetIsArray) ? poffset[i] : poffset);
            var p1 = p0 + di.w;
            var s0 = di.b;
            var s1 = s0 + di.s;

            var shouldRemove = false;

            var rp0 = radialAxis.c2p(s0);
            var rp1 = radialAxis.c2p(s1);
            var thetag0 = angularAxis.c2g(p0);
            var thetag1 = angularAxis.c2g(p1);

            // TODO check for overlapping corners too
            if(shouldRemove) {
                bar.remove();
                return;
            }

            // for selections
            // di.ct = ra2xy(s1, (p0 + p1) / 2);

            // // for hover
            // di.x = xa.p2c(di.ct[0]);
            // di.y = ya.p2c(di.ct[1]);

            // TODO round up bar borders?
            // if so, factor out that logic from Bar.plot

            // TODO should be a polygon when polar.vangles is defined!
            Lib.ensureSingle(bar, 'path')
                .style('vector-effect', 'non-scaling-stroke')
                .attr('d', pathAnnulus(rp0, rp1, thetag0, thetag1, subplot.cxx, subplot.cyy));
        });
    });
};

// TODO recycle this routine with the ones used
// for pie traces and polar subplots
function pathAnnulus(r0, r1, a0, a1, cx, cy) {
    cx = cx || 0;
    cy = cy || 0;

    // make a0 < a1, always
    if(a1 < a0) a1 = [a0, a0 = a1][0];
    var largeArc = a1 - a0 <= Math.PI ? 0 : 1;

    function pt(r, s) {
        return [r * Math.cos(s) + cx, cy - r * Math.sin(s)];
    }

    function arc(r, s, cw) {
        return 'A' + [r, r] + ' ' + [0, largeArc, cw] + ' ' + pt(r, s);
    }

    // sector angle at [s]tart, [m]iddle and [e]nd
    var ss, sm, se;

    if(Lib.isFullCircle([a0, a1].map(Lib.rad2deg))) {
        ss = 0;
        se = 2 * Math.PI;
        sm = Math.PI;
        return 'M' + pt(r0, ss) +
            arc(r0, sm, 0) +
            arc(r0, se, 0) +
            'Z' +
            'M' + pt(r1, ss) +
            arc(r1, sm, 1) +
            arc(r1, se, 1) +
            'Z';
    } else {
        ss = a0;
        se = a1;
        return 'M' + pt(r0, ss) +
            'L' + pt(r1, ss) +
            arc(r1, se, 0) +
            'L' + pt(r0, se) +
            arc(r0, ss, 1) +
            'Z';
    }
}
