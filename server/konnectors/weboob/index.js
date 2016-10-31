'use strict';
/**
 * A Konnector to communicate with a Weboob instance.
 *
 * You need a running [cozyweboob](https://github.com/Phyks/cozyweboob)
 * somewhere.
 */

// NPM imports
import requestJson from 'request-json';

// Konnectors imports
import baseKonnector from '../../lib/base_konnector';
import saveDataAndFile from '../../lib/save_data_and_file';

// Models imports
// TODO: Add support for others models
import Bill from '../../models/bill';

// Local imports
import Converters from './converters';


/**
 * Konnector definition.
 */
const weboobKonnector = baseKonnector.createNew({
    name: 'Weboob',
    vendorLink: 'https://github.com/Phyks/cozyweboob',
    fields: {
        weboobURL: 'text',
        JSONModulesDescription: 'text',
    },
    models: [
        Bill
    ],
    fetchOperations: [
        fetchData,
        parseData,
        customSaveDataAndFile,
    ],
});


/**
 * fetchData
 *
 * Fetch all the required data from the Weboob instance.
 */
function fetchData(requiredFields, entries, data, next) {
    var client = requestJson.createClient(requiredFields.weboobURL);
    client.post(
        '/fetch',
        JSON.parse(requiredFields.JSONModulesDescription),
        function (err, res, fetchedItems) {
            // Store fetched entries
            console.assert(res.statusCode == 200);
            data.rawEntries = fetchedItems;
            next();
        }
    );
}


/**
 * parseData
 *
 * Parse all the data we got back from the API, converting it to Cozy models.
 */
function parseData(requiredFields, entries, data, next) {
    data.parsedEntries = {};
    Object.keys(data.rawEntries).forEach(function (moduleName) {
        let moduleData = data.rawEntries[moduleName];
        Object.keys(moduleData).forEach(function (weboobType) {
            if (Converters[weboobType] === undefined) {
                return;
            }
            let fieldData = moduleData[weboobType];
            // Convert all the available entries and store them in parsed
            // entries
            let { cozyModel, parsedData } = Converters[weboobType](fieldData, moduleName);
            if (cozyModel !== undefined && parsedData !== undefined) {
                data.parsedEntries[cozyModel] = [].concat(
                    data.parsedEntries[cozyModel] || [],
                    parsedData
                );
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
    const fileOptions = {
        vendor: 'weboob',  // TODO
        dateFormat: 'YYYYMMDD',
    };
    entries.fetched = data.parsedEntries[Bill];
    if (entries.fetched !== undefined) {
        saveDataAndFile(weboobKonnector.logger, Bill, fileOptions, ['bill']) (requiredFields, entries, data, next);
    }
}

export default weboobKonnector;
