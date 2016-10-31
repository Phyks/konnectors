'use strict';
/**
 * A Konnector to communicate with a Weboob instance.
 *
 * You need a running [cozyweboob](https://github.com/Phyks/cozyweboob)
 * somewhere.
 *
 * // TODO: What happens when moment is an invalid date?
 */

// NPM imports

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _requestJson = require('request-json');

var _requestJson2 = _interopRequireDefault(_requestJson);

var _base_konnector = require('../../lib/base_konnector');

var _base_konnector2 = _interopRequireDefault(_base_konnector);

var _save_data_and_file = require('../../lib/save_data_and_file');

var _save_data_and_file2 = _interopRequireDefault(_save_data_and_file);

var _bill = require('../../models/bill');

var _bill2 = _interopRequireDefault(_bill);

var _converters = require('./converters');

var _converters2 = _interopRequireDefault(_converters);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Konnector definition.
 */


// Models imports
// TODO: Add support for others models


// Konnectors imports
var weboobKonnector = _base_konnector2.default.createNew({
    name: 'Weboob',
    vendorLink: 'https://github.com/Phyks/cozyweboob',
    fields: {
        weboobURL: 'text',
        JSONModulesDescription: 'text'
    },
    models: [_bill2.default],
    fetchOperations: [fetchData, parseData, customSaveDataAndFile]
});

/**
 * fetchData
 *
 * Fetch all the required data from the Weboob instance.
 */


// Local imports
function fetchData(requiredFields, entries, data, next) {
    var client = _requestJson2.default.createClient(requiredFields.weboobURL);
    client.post('/fetch', JSON.parse(requiredFields.JSONModulesDescription), function (err, res, fetchedItems) {
        // Store fetched entries
        console.assert(res.statusCode == 200);
        data.rawEntries = fetchedItems;
        next();
    });
}

/**
 * parseData
 *
 * Parse all the data we got back from the API, converting it to Cozy models.
 */
function parseData(requiredFields, entries, data, next) {
    data.parsedEntries = {};
    Object.keys(data.rawEntries).forEach(function (moduleName) {
        var moduleData = data.rawEntries[moduleName];
        Object.keys(moduleData).forEach(function (weboobType) {
            if (_converters2.default[weboobType] === undefined) {
                return;
            }
            var fieldData = moduleData[weboobType];
            // Convert all the available entries and store them in parsed
            // entries

            var _Converters$weboobTyp = _converters2.default[weboobType](fieldData, moduleName);

            var cozyModel = _Converters$weboobTyp.cozyModel;
            var parsedData = _Converters$weboobTyp.parsedData;

            if (cozyModel !== undefined && parsedData !== undefined) {
                data.parsedEntries[cozyModel] = [].concat(data.parsedEntries[cozyModel] || [], parsedData);
            }
        });
    });
    next();
}

/**
 * customSaveDataAndFile
 *
 * Custom wrapper around saveDataAndFile layer, to use the connector own logger.
 */
function customSaveDataAndFile(requiredFields, entries, data, next) {
    var fileOptions = {
        vendor: 'weboob', // TODO
        dateFormat: 'YYYYMMDD'
    };
    entries.fetched = data.parsedEntries[_bill2.default];
    if (entries.fetched !== undefined) {
        (0, _save_data_and_file2.default)(weboobKonnector.logger, _bill2.default, fileOptions, ['bill'])(requiredFields, entries, data, next);
    }
}

exports.default = weboobKonnector;