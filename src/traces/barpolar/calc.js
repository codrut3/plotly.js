/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hasColorscale = require('../../components/colorscale/has_colorscale');
var colorscaleCalc = require('../../components/colorscale/calc');
var arraysToCalcdata = require('../bar/arrays_to_calcdata');
var setGroupPositions = require('../bar/cross_trace_calc').setGroupPositions;
var calcSelection = require('../scatter/calc_selection');
var traceIs = require('../../registry').traceIs;
var extendFlat = require('../../lib').extendFlat;

function calc(gd, trace) {
    var fullLayout = gd._fullLayout;
    var subplotId = trace.subplot;
    var radialAxis = fullLayout[subplotId].radialaxis;
    var angularAxis = fullLayout[subplotId].angularaxis;
    var rArray = radialAxis.makeCalcdata(trace, 'r');
    var thetaArray = angularAxis.makeCalcdata(trace, 'theta');
    var len = trace._length;
    var cd = new Array(len);

    // 'size' axis variables
    var sArray;
    // 'pos' axis variables
    var pArray;

    if(trace.orientation === 'radial') {
        sArray = rArray;
        pArray = thetaArray;
    } else {
        sArray = thetaArray;
        pArray = rArray;
    }

    for(var i = 0; i < len; i++) {
        cd[i] = {p: pArray[i], s: sArray[i]};
    }

    if(hasColorscale(trace, 'marker')) {
        colorscaleCalc(trace, trace.marker.color, 'marker', 'c');
    }
    if(hasColorscale(trace, 'marker.line')) {
        colorscaleCalc(trace, trace.marker.line.color, 'marker.line', 'c');
    }

    arraysToCalcdata(cd, trace);
    calcSelection(cd, trace);

    return cd;
}

function crossTraceCalc(gd, polarLayout) {
    var calcdata = gd.calcdata;
    var cdRadial = [];
    var cdAngular = [];

    for(var i = 0; i < calcdata.length; i++) {
        var cdi = calcdata[i];
        var trace = cdi[0].trace;

        if(trace.visible === true && traceIs(trace, 'bar')) {
            if(trace.orientation === 'radial') {
                cdRadial.push(cdi);
            } else {
                cdAngular.push(cdi);
            }
        }
    }

    // to make _extremes is filled in correctly so that
    // polar._subplot.radialAxis can get auotrange'd
    // TODO clean up!
    // I think we want to call getAutorange on polar.radialaxis
    // NOT on polar._subplot.radialAxis
    var rAxis = extendFlat({}, polarLayout.radialaxis, {_id: 'x'});
    var aAxis = polarLayout.angularaxis;

    setGroupPositions(gd, aAxis, rAxis, cdRadial);
    setGroupPositions(gd, rAxis, aAxis, cdAngular);
}

module.exports = {
    calc: calc,
    crossTraceCalc: crossTraceCalc
};
