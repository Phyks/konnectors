'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _bill = require('../../../models/bill');

var _bill2 = _interopRequireDefault(_bill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Converters between exported data and Bill model in Cozy Konnectors.
 *
 * Maps all the available weboob types in the exported JSON to function
 * exporting a matching Cozy Model.
 */

// NPM imports
var BillConverters = {
    // Conversion functions for CapDocument items to Bill
    'subscriptions': function subscriptions(data, moduleName) {
        // Weboob type: Subscription
        // Do nothing for subscriptions
        return {
            cozyModel: undefined,
            parsedData: undefined
        };
    },
    'bills': function bills(data, moduleName) {
        // Weboob type: Bill
        var parsedBills = [];
        Object.keys(data).forEach(function (subscriptionID) {
            data[subscriptionID].forEach(function (bill) {
                // TODO: Label not mapped
                parsedBills.push({
                    type: '', // TODO: What is it?
                    subtype: '', // TODO: What is it?
                    date: (0, _moment2.default)(bill.date),
                    vendor: moduleName,
                    amount: parseFloat(bill.price),
                    vat: parseFloat(bill.vat),
                    currency: bill.currency,
                    plan: '', // TODO: What is it?
                    pdfurl: bill.url,
                    content: '', // TODO: What is it?
                    duedate: bill.duedate ? (0, _moment2.default)(bill.duedate) : null,
                    startdate: bill.startdate ? (0, _moment2.default)(bill.startdate) : null,
                    finishdate: bill.finishdate ? (0, _moment2.default)(bill.finishdate) : null
                });
            });
        });
        return {
            cozyModel: _bill2.default,
            parsedData: parsedBills
        };
    },
    'history_bills': function history_bills(data, moduleName) {
        // Weboob type: Details
        var parsedHistoryBills = [];
        Object.keys(data).forEach(function (subscriptionID) {
            data[subscriptionID].forEach(function (historyBill) {
                // TODO: Infos / label / quantity / unit not mapped
                parsedHistoryBills.push({
                    type: '', // TODO: What is it?
                    subtype: '', // TODO: What is it?
                    date: (0, _moment2.default)(historyBill.datetime),
                    vendor: moduleName,
                    amount: parseFloat(historyBill.price),
                    vat: parseFloat(historyBill.vat),
                    currency: historyBill.currency,
                    plan: '', // TODO: What is it?
                    pdfurl: historyBill.url,
                    content: '' });
            });
        });
        return {
            cozyModel: _bill2.default,
            parsedData: parsedHistoryBills
        };
    },
    'detailed_bills': function detailed_bills(data, moduleName) {
        // Weboob type: Details
        var parsedDetailedBills = [];
        Object.keys(data).forEach(function (subscriptionID) {
            data[subscriptionID].forEach(function (detailedBill) {
                parsedDetailedBills.push({
                    // TODO: Infos / label / quantity / unit not mapped
                    type: '', // TODO: What is it?
                    subtype: '', // TODO: What is it?
                    date: (0, _moment2.default)(detailedBill.datetime),
                    vendor: moduleName,
                    amount: parseFloat(detailedBill.price),
                    vat: parseFloat(detailedBill.vat),
                    currency: detailedBill.currency,
                    plan: '', // TODO: What is it?
                    pdfurl: detailedBill.url,
                    content: '' });
            });
        });
        return {
            cozyModel: _bill2.default,
            parsedData: parsedDetailedBills
        };
    }
};

// Local imports
exports.default = BillConverters;