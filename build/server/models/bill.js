// Generated by CoffeeScript 1.10.0
var Bill, cozydb;

cozydb = require('cozydb');

module.exports = Bill = cozydb.getModel('Bill', {
  type: String,
  subtype: String,
  date: Date,
  vendor: String,
  amount: Number,
  vat: Number,
  currency: String,
  plan: String,
  pdfurl: String,
  binaryId: String,
  fileId: String,
  content: String,
  isRefund: Boolean,
  duedate: Date,
  startdate: Date,
  finishdate: Date
});

Bill.all = function(callback) {
  return Bill.request('byDate', callback);
};
