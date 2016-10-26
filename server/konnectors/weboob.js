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
const moment = require('moment');
const requestJson = require('request-json');

// Konnectors imports
const baseKonnector = require('../lib/base_konnector');
const saveDataAndFile = require('../lib/save_data_and_file');

// Models imports
// TODO: Add support for others models
const Bill = require('../models/bill');


/**
 * Converters between exported data and available models in Cozy Konnectors.
 *
 * Maps all the available weboob types in the exported JSON to function
 * exporting a matching Cozy Model.
 */
const Converter = {
    // Conversion functions for CapDocument items to Bill
    'subscriptions': function (data, moduleName) {  // Weboob type: Subscription
        // Do nothing for subscriptions
        return {
            cozyModel: undefined,
            parsedData: undefined,
        };
    },
    'bills': function (data, moduleName) {  // Weboob type: Bill
        var parsedBills = [];
        Object.keys(data).forEach(function (subscriptionID) {
            data[subscriptionID].forEach(function (bill) {
                // TODO: Label not mapped
                parsedBills.push({
                    type: '',  // TODO: What is it?
                    subtype: '',  // TODO: What is it?
                    date: moment(bill.date),
                    vendor: moduleName,
                    amount: parseFloat(bill.price),
                    vat: parseFloat(bill.vat),
                    currency: bill.currency,
                    plan: '',  // TODO: What is it?
                    pdfurl: bill.url,
                    content: '',  // TODO: What is it?
                    duedate: moment(bill.duedate),
                    startdate: moment(bill.startdate),
                    finishdate: moment(bill.finishdate),
                });
            });
        });
        return {
            cozyModel: Bill,
            parsedData: parsedBills,
        };
    },
    'history_bills': function (data, moduleName) {  // Weboob type: Details
        var parsedHistoryBills = [];
        Object.keys(data).forEach(function (subscriptionID) {
            data[subscriptionID].forEach(function (historyBill) {
                // TODO: Infos / label / quantity / unit not mapped
                parsedHistoryBills.push({
                    type: '',  // TODO: What is it?
                    subtype: '',  // TODO: What is it?
                    date: moment(historyBill.datetime),
                    vendor: moduleName,
                    amount: parseFloat(historyBill.price),
                    vat: parseFloat(historyBill.vat),
                    currency: historyBill.currency,
                    plan: '',  // TODO: What is it?
                    pdfurl: historyBill.url,
                    content: '',  // TODO: What is it?
                });
            });
        });
        return {
            cozyModel: Bill,
            parsedData: parsedHistoryBills
        };
    },
    'detailed_bills': function (data, moduleName) {  // Weboob type: Details
        var parsedDetailedBills = [];
        Object.keys(data).forEach(function (subscriptionID) {
            data[subscriptionID].forEach(function (detailedBill) {
                parsedDetailedBills.push({
                    // TODO: Infos / label / quantity / unit not mapped
                    type: '',  // TODO: What is it?
                    subtype: '',  // TODO: What is it?
                    date: moment(detailedBill.datetime),
                    vendor: moduleName,
                    amount: parseFloat(detailedBill.price),
                    vat: parseFloat(detailedBill.vat),
                    currency: detailedBill.currency,
                    plan: '',  // TODO: What is it?
                    pdfurl: detailedBill.url,
                    content: '',  // TODO: What is it?
                });
            });
        });
        return {
            cozyModel: Bill,
            parsedData: parsedDetailedBills
        };
    },
};


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
            if (Converter[weboobType] === undefined) {
                return;
            }
            let fieldData = moduleData[weboobType];
            // Convert all the available entries and store them in parsed
            // entries
            let { cozyModel, parsedData } = Converter[weboobType](fieldData, moduleName);
            console.log(cozyModel);
            console.log(parsedData);
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


module.exports = weboobKonnector;
