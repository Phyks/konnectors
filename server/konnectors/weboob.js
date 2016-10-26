'use strict';
/**
 * A Konnector to communicate with a Weboob instance.
 *
 * You need a running [cozyweboob](https://github.com/Phyks/cozyweboob)
 * somewhere.
 *
 * // TODO: What happens when moment is an invalid date?
 */
const requestJson = require('request-json');
const baseKonnector = require('../lib/base_konnector');
const saveDataAndFile = require('../lib/save_data_and_file');

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
    'subscriptions': function (data, moduleName) {  // Weboobtype: Subscription
        // Do nothing for subscriptions
    },
    'bills': function (data, moduleName) {  // Weboobtype: Bill
        var parsedBills = [];
        data.forEach(function (subscriptionID, bill) {
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
        return parsedBills;
    },
    'history_bills': function (data, moduleName) {  // Weboobtype: Details
        var parsedHistoryBills = [];
        data.forEach(function (subscriptionID, historyBill) {
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
        return parsedHistoryBills;
    },
    'detailed_bills': function (data, moduleName) {  // Weboobtype: Details
        var parsedDetailedBills = [];
        data.forEach(function (subscriptionID, detailedBill) {
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
        return parsedDetailedBills;
    },
};


/**
 * Konnector definition.
 */
const weboobKonnector = module.exports = baseKonnector.createNew({
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
        { params: requiredFields.JSONModulesDescription },
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
    entries.fetched = {};
    data.rawEntries.forEach(function (moduleName, moduleData) {
        moduleData.forEach(function (weboobType, fieldData) {
            // Convert all the available entries and store them in parsed
            // entries
            let { cozyModel, parsedData } = Converter[weboobType](fieldData, moduleName);
            entries.fetched[cozyModel] = Array.concat(
                entries.fetched[cozyModel] || [],
                parsedData
            );
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
    return saveDataAndFile(weboobKonnector.logger, Bill, fileOptions, ['bill']);  // TODO: How to use?
}
