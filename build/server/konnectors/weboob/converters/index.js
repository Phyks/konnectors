'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Bill = require('./Bill');

var _Bill2 = _interopRequireDefault(_Bill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Export global converters object
var Converters = Object.assign({}, _Bill2.default); /**
                                                     * Converters between exported data and available models in Cozy Konnectors.
                                                     *
                                                     * Maps all the available weboob types in the exported JSON to function
                                                     * exporting a matching Cozy Model.
                                                     */

// Import converters
exports.default = Converters;