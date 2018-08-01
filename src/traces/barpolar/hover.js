/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var barHover = require('../bar/hover');
var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');

function hoverPoints(pointData, xval, yval, hovermode) {
    // TODO might need a seperate hoverPoints in r/theta space
    var barPointData = barHover(pointData, xval, yval, hovermode);
    if(!barPointData || barPointData[0].index === false) return;

    var newPointData = barPointData[0];

    var subplot = pointData.subplot;
    var cdi = newPointData.cd[newPointData.index];
    var trace = newPointData.trace;

    newPointData.xLabelVal = undefined;
    newPointData.yLabelVal = undefined;
    newPointData.extraText = makeHoverPointText(cdi, trace, subplot);

    return barPointData;
}

function makeHoverPointText(cdi, trace, subplot) {
    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;
    var hoverinfo = cdi.hi || trace.hoverinfo;
    var parts = hoverinfo.split('+');
    var text = [];

    radialAxis._hovertitle = 'r';
    angularAxis._hovertitle = 'θ';

    var rad = angularAxis._c2rad(cdi.theta, trace.thetaunit);

    // show theta value in unit of angular axis
    var theta;
    if(angularAxis.type === 'linear' && trace.thetaunit !== angularAxis.thetaunit) {
        theta = angularAxis.thetaunit === 'degrees' ? Lib.rad2deg(rad) : rad;
    } else {
        theta = cdi.theta;
    }

    function textPart(ax, val) {
        text.push(ax._hovertitle + ': ' + Axes.tickText(ax, val, 'hover').text);
    }

    if(parts.indexOf('all') !== -1) parts = ['r', 'theta'];
    if(parts.indexOf('r') !== -1) textPart(radialAxis, radialAxis.c2r(cdi.r));
    if(parts.indexOf('theta') !== -1) textPart(angularAxis, theta);

    return text.join('<br>');
}

module.exports = {
    hoverPoints: hoverPoints,
    makeHoverPointText: makeHoverPointText
};
