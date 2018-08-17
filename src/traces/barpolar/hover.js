/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var barHover = require('../bar/hover');
var makeHoverPointText = require('../scatterpolar/hover').makeHoverPointText;
var Color = require('../../components/color')
var Fx = require('../../components/fx');
var Lib = require('../../lib');

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var t = cd[0].t;

    var subplot = pointData.subplot;
    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;
    var xa = subplot.xaxis;
    var ya = subplot.yaxis;

    // these are in 'g'eometric coordinates
    var rVal = Math.sqrt(xval * xval + yval * yval);
    var thetaVal = Math.atan2(yval, xval);

    // TODO add padding around sector to show labels,
    // when hovering "close to" them
    //
    // TODO handle case with polar.vangles
    var distFn = function(di) {
        var sector = [di.p0, di.p1].map(angularAxis.c2g).map(Lib.rad2deg);

        return (
            isAngleInSector(thetaVal, sector) &&
            rVal >= radialAxis.c2g(di.s0) &&
            rVal <= radialAxis.c2g(di.s1)
        ) ? 1 : Infinity;
    };

    Fx.getClosest(cd, distFn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index === false) return;

    var index = pointData.index;
    var cdi = cd[index];
    var rg = radialAxis.c2g(cdi.s1);
    // TODO include offset here?
    var thetag = angularAxis.c2g(cdi.p);
    var xp = xa.c2p(rg * Math.cos(thetag));
    var yp = ya.c2p(rg * Math.sin(thetag));

    // TODO use 'extents' like in Bar.hover?
    pointData.x0 = pointData.x1 = xp;
    pointData.y0 = pointData.y1 = yp;

    var _cdi = Lib.extendFlat({}, cdi, {r: cdi.s, theta: cdi.p});
    pointData.extraText = makeHoverPointText(_cdi, trace, subplot);
    pointData.xLabelVal = undefined;
    pointData.yLabelVal = undefined;

    // TODO DRY-up with Bar.hover
    var mc = cdi.mcc || trace.marker.color;
    var mlc = cdi.mlcc || trace.marker.line.color;
    var mlw = cdi.mlw || trace.marker.line.width;
    if(Color.opacity(mc)) pointData.color = mc;
    else if(Color.opacity(mlc) && mlw) pointData.color = mlc;

    return [pointData];
};

// TODO move to lib/angles, DRY with polar.js version
function isAngleInSector(rad, sector) {
    if(Lib.isFullCircle(sector)) return true;

    var s0, s1;

    if(sector[0] < sector[1]) {
        s0 = sector[0];
        s1 = sector[1];
    } else {
        s0 = sector[1];
        s1 = sector[0];
    }

    s0 = Lib.wrap360(s0);
    s1 = Lib.wrap360(s1);
    if(s0 > s1) s1 += 360;

    var deg = Lib.wrap360(Lib.rad2deg(rad));
    var nextTurnDeg = deg + 360;

    return (deg >= s0 && deg <= s1) ||
        (nextTurnDeg >= s0 && nextTurnDeg <= s1);
}
