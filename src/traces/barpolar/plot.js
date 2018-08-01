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

    var bartraces = barLayer.selectAll('g.trace.bars')
        .data(cdbar, function(d) { return d[0].trace.uid; });

    bartraces.enter().append('g')
        .attr('class', 'trace bars')
        .append('g')
        .attr('class', 'points');

    bartraces.exit().remove();

    bartraces.order();

    bartraces.each(function(d) {
        var cd0 = d[0];
        var t = cd0.t;
        var trace = cd0.trace;
        var sel = cd0.node3 = d3.select(this);

        var poffset = t.poffset;
        var poffsetIsArray = Array.isArray(poffset);

        var bars = sel.select('g.points').selectAll('g.point').data(Lib.identity);

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

            console.log(di.p, poffset, di.w, di.b, di.s)

            var shouldRemove = false;

            var ra2xy = function(r, a) {
                if(!isNumeric(r) || !isNumeric(a)) {
                    shouldRemove = true;
                    return;
                }

                var rg = radialAxis.c2g(r);
                var thetag = angularAxis.c2g(a);
                var xc = rg * Math.cos(thetag);
                var yc = rg * Math.sin(thetag);
                return [xa.c2p(xc), ya.c2p(yc)];
            };

            var corners = [
                ra2xy(s0, p0), ra2xy(s0, p1),
                ra2xy(s1, p1), ra2xy(s1, p0)
            ];

            // TODO check for overlapping corners too
            if(shouldRemove) {
                bar.remove();
                return;
            }

            // for selections
            di.ct = ra2xy(s1, (p0 + p1) / 2);

            // for hover
            di.x = xa.p2c(di.ct[0]);
            di.y = ya.p2c(di.ct[1]);

            // TODO round up bar borders?

            // TODO should an arc
            Lib.ensureSingle(bar, 'path')
                .style('vector-effect', 'non-scaling-stroke')
                .attr('d', 'M' + corners.join('L') + 'Z');
        });
    });
};
