// Generated by CoffeeScript 1.10.0
var CodeBill, File, cheerio, cozydb, fetcher, filterExisting, fs, linkBankOperation, localization, log, logIn, moment, parsePage, request, saveDataAndFile;

cozydb = require('cozydb');

request = require('request');

moment = require('moment');

cheerio = require('cheerio');

fs = require('fs');

File = require('../models/file');

fetcher = require('../lib/fetcher');

filterExisting = require('../lib/filter_existing');

saveDataAndFile = require('../lib/save_data_and_file');

linkBankOperation = require('../lib/link_bank_operation');

localization = require('../lib/localization_manager');

log = require('printit')({
  prefix: "Github",
  date: true
});

CodeBill = cozydb.getModel('CodeBill', {
  date: Date,
  vendor: String,
  amount: Number,
  plan: String,
  fileId: String,
  pdfurl: String,
  binaryId: String
});

CodeBill.all = function(callback) {
  return CodeBill.request('byDate', callback);
};

module.exports = {
  name: "Github",
  slug: "github",
  description: 'konnector description github',
  vendorLink: "https://www.github.com/",
  fields: {
    login: "text",
    password: "password",
    folderPath: "folder"
  },
  models: {
    codebill: CodeBill
  },
  init: function(callback) {
    var map;
    map = function(doc) {
      return emit(doc.date, doc);
    };
    return CodeBill.defineRequest('byDate', map, function(err) {
      return callback(err);
    });
  },
  fetch: function(requiredFields, callback) {
    log.info("Import started");
    return fetcher["new"]().use(logIn).use(parsePage).use(filterExisting(log, CodeBill)).use(saveDataAndFile(log, CodeBill, 'github', ['bill'])).use(linkBankOperation({
      log: log,
      model: CodeBill,
      identifier: 'github',
      dateDelta: 4,
      amountDelta: 5
    })).args(requiredFields, {}, {}).fetch(function(err, fields, entries) {
      var localizationKey, notifContent, options, ref;
      log.info("Import finished");
      notifContent = null;
      if ((entries != null ? (ref = entries.filtered) != null ? ref.length : void 0 : void 0) > 0) {
        localizationKey = 'notification bills';
        options = {
          smart_count: entries.filtered.length
        };
        notifContent = localization.t(localizationKey, options);
      }
      return callback(err, notifContent);
    });
  }
};

logIn = function(requiredFields, billInfos, data, next) {
  var billOptions, logInOptions, loginUrl, signInOptions;
  loginUrl = "https://github.com/session";
  signInOptions = {
    method: 'POST',
    jar: true,
    url: "https://github.com/session",
    form: {
      login: requiredFields.login,
      password: requiredFields.password,
      commit: 'Sign in'
    }
  };
  logInOptions = {
    method: 'GET',
    jar: true,
    url: "https://github.com/login"
  };
  billOptions = {
    method: 'GET',
    jar: true,
    url: "https://github.com/settings/billing"
  };
  return request(logInOptions, function(err, res, body) {
    var $, inputs, token;
    if (err) {
      log.error(err);
      return next('bad credentials');
    }
    $ = cheerio.load(body);
    inputs = $('#login input');
    if (inputs.length > 2) {
      token = $(inputs[1]).val();
    } else {
      token = '';
    }
    if (!token) {
      return next('token not found');
    }
    signInOptions.form.authenticity_token = token;
    return request(signInOptions, function(err, res, body) {
      return request(billOptions, function(err, res, body) {
        if (err) {
          log.error(err);
          next('request error');
        }
        data.html = body;
        return next();
      });
    });
  });
};

parsePage = function(requiredFields, bills, data, next) {
  var $;
  bills.fetched = [];
  $ = cheerio.load(data.html);
  $('.succeeded').each(function() {
    var amount, amountText, date, pdfurl, plan;
    date = $(this).find('.date time').text();
    amountText = $(this).find('.amount').text();
    amountText = amountText.trim().substring(1);
    amount = parseFloat(amountText);
    pdfurl = "https://github.com" + ($(this).find('.receipt a').attr('href'));
    switch (amount) {
      case 7:
        plan = 'micro';
        break;
      case 12:
        plan = 'small';
        break;
      case 22:
        plan = 'medium';
        break;
      case 50:
        plan = 'large';
    }
    return bills.fetched.push({
      date: moment(date),
      amount: amount,
      pdfurl: pdfurl,
      plan: plan
    });
  });
  if (bills.fetched.length === 0) {
    log.info("No bills retrieved.");
    return next();
  } else {
    return next();
  }
};
