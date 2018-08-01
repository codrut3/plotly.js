/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');

module.exports = function(layoutIn, layoutOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    // TODO
    // will conflict with Bar.supplyLayoutDefaults,
    // - should be coerced in polar? container
    // - or maybe :hocho: layout attributes altogether and
    //   move to trace 'group' attribute strategy

    coerce('barmode');
    coerce('bargap');
};
