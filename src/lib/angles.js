/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var PI = Math.PI;

function deg2rad(deg) {
    return deg / 180 * PI;
}

function rad2deg(rad) {
    return rad / PI * 180;
}

function wrap360(deg) {
    var out = deg % 360;
    return out < 0 ? out + 360 : out;
}

function wrap180(deg) {
    if(Math.abs(deg) > 180) deg -= Math.round(deg / 360) * 360;
    return deg;
}

/**
 * is sector a full circle?
 * ... this comes up a lot in SVG path-drawing routines
 *
 * @param {2-item array} sector sector angles in *degrees*
 * @return {boolean}
 */
function isFullCircle(sector) {
    var arc = Math.abs(sector[1] - sector[0]);
    return arc === 360;
}

/**
 * angular delta between angle 'a' and 'b'
 * solution taken from: https://stackoverflow.com/a/2007279
 *
 * @param {number} a : first angle in *radians*
 * @param {number} b : second angle in *radians*
 * @return {number} angular delta in *radians*
 */
function angleDelta(a, b) {
    var d = b - a;
    return Math.atan2(Math.sin(d), Math.cos(d));
}

/**
 * angular distance between angle 'a' and 'b'
 *
 * @param {number} a : first angle in *radians*
 * @param {number} b : second angle in *radians*
 * @return {number} angular distance in *radians*
 */
function angleDist(a, b) {
    return Math.abs(angleDelta(a, b));
}

/**
 * is angle inside sector?
 *
 * @param {number} a : angle to test in *radians*
 * @param {2-item array} sector : sector angles in *degrees*
 * @param {boolean}
 */
function isAngleInsideSector(a, sector) {
    if(isFullCircle(sector)) return true;

    var s0, s1;

    if(sector[0] < sector[1]) {
        s0 = sector[0];
        s1 = sector[1];
    } else {
        s0 = sector[1];
        s1 = sector[0];
    }

    s0 = wrap360(s0);
    s1 = wrap360(s1);
    if(s0 > s1) s1 += 360;

    var a0 = wrap360(rad2deg(a));
    var a1 = a0 + 360;

    return (a0 >= s0 && a0 <= s1) || (a1 >= s0 && a1 <= s1);
}

/**
 * is pt (r,a) inside sector?
 *
 * @param {number} r : pt's radial coordinate
 * @param {number} a : pt's angular coordinate in *radians*
 * @param {2-item array} rRng : sector's radial range
 * @param {2-item array} sector : sector angles in *degrees*
 * @return {boolean}
 */
function isPtInsideSector(r, a, rRng, sector) {
    if(!isAngleInsideSector(a, sector)) return false;

    var r0, r1;

    if(rRng[0] < rRng[1]) {
        r0 = rRng[0];
        r1 = rRng[1];
    } else {
        r0 = rRng[1];
        r1 = rRng[0];
    }

    return r >= r0 && r <= r1;
}

// common to pathArc, pathSector and pathAnnulus
function _path(r0, r1, a0, a1, cx, cy, isClosed) {
    cx = cx || 0;
    cy = cy || 0;

    var isCircle = isFullCircle([a0, a1].map(rad2deg));
    var aStart, aMid, aEnd;
    var rStart, rEnd;

    if(isCircle) {
        aStart = 0;
        aMid = PI;
        aEnd = 2 * PI;
    } else {
        if(a0 < a1) {
            aStart = a0;
            aEnd = a1;
        } else {
            aStart = a1;
            aEnd = a0;
        }
    }

    if(r0 < r1) {
        rStart = r0;
        rEnd = r1;
    } else {
        rStart = r1;
        rEnd = r0;
    }

    // N.B. svg coordinates here, where y increases downward
    function pt(r, a) {
        return [r * Math.cos(a) + cx, cy - r * Math.sin(a)];
    }

    var largeArc = Math.abs(aEnd - aStart) <= PI ? 0 : 1;
    function arc(r, a, cw) {
        return 'A' + [r, r] + ' ' + [0, largeArc, cw] + ' ' + pt(r, a);
    }

    var p;

    if(isCircle) {
        if(rStart === null) {
            p = 'M' + pt(rEnd, aStart) +
                arc(rEnd, aMid, 0) +
                arc(rEnd, aEnd, 0) + 'Z';
        } else {
            p = 'M' + pt(rStart, aStart) +
                arc(rStart, aMid, 0) +
                arc(rStart, aEnd, 0) + 'Z' +
                'M' + pt(rEnd, aStart) +
                arc(rEnd, aMid, 1) +
                arc(rEnd, aEnd, 1) + 'Z';
        }
    } else {
        if(rStart === null) {
            p = 'M' + pt(rEnd, aStart) + arc(rEnd, aEnd, 0);
            if(isClosed) p += 'L0,0Z';
        } else {
            p = 'M' + pt(rStart, aStart) +
                'L' + pt(rEnd, aStart) +
                arc(rEnd, aEnd, 0) +
                'L' + pt(rStart, aEnd) +
                arc(rStart, aStart, 1) + 'Z';
        }
    }

    return p;
}

/**
 * path an arc
 *
 * @param {number} r : radius
 * @param {number} a0 : first angular coordinate
 * @param {number} a1 : second angular coordinate
 * @param {number (optional)} cx : x coordinate of center
 * @param {number (optional)} cy : y coordinate of center
 * @return {string} svg path
 */
function pathArc(r, a0, a1, cx, cy) {
    return _path(null, r, a0, a1, cx, cy, 0);
}

/**
 * path a sector
 *
 * @param {number} r : radius
 * @param {number} a0 : first angular coordinate
 * @param {number} a1 : second angular coordinate
 * @param {number (optional)} cx : x coordinate of center
 * @param {number (optional)} cy : y coordinate of center
 * @return {string} svg path
 */
function pathSector(r, a0, a1, cx, cy) {
    return _path(null, r, a0, a1, cx, cy, 1);
}

/**
 * path an annulus
 *
 * @param {number} r0 : first radial coordinate
 * @param {number} r1 : second radial coordinate
 * @param {number} a0 : first angular coordinate
 * @param {number} a1 : second angular coordinate
 * @param {number (optional)} cx : x coordinate of center
 * @param {number (optional)} cy : y coordinate of center
 * @return {string} svg path
 */
function pathAnnulus(r0, r1, a0, a1, cx, cy) {
    return _path(r0, r1, a0, a1, cx, cy, 1);
}

module.exports = {
    deg2rad: deg2rad,
    rad2deg: rad2deg,
    wrap360: wrap360,
    wrap180: wrap180,
    angleDelta: angleDelta,
    angleDist: angleDist,
    isFullCircle: isFullCircle,
    isAngleInsideSector: isAngleInsideSector,
    isPtInsideSector: isPtInsideSector,
    pathArc: pathArc,
    pathSector: pathSector,
    pathAnnulus: pathAnnulus
};
