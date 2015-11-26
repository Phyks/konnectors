// Generated by CoffeeScript 1.9.3
var Bill, cheerio, cozydb, fetcher, filterExisting, linkBankOperation, localization, log, logIn, moment, parsePage, request, saveDataAndFile;

cozydb = require('cozydb');

request = require('request');

moment = require('moment');

cheerio = require('cheerio');

fetcher = require('../lib/fetcher');

filterExisting = require('../lib/filter_existing');

saveDataAndFile = require('../lib/save_data_and_file');

linkBankOperation = require('../lib/link_bank_operation');

localization = require('../lib/localization_manager');

log = require('printit')({
  prefix: "numericable",
  date: true
});

Bill = require('../models/bill');

module.exports = {
  name: "Numéricable",
  slug: "numericable",
  description: 'konnector description numericable',
  vendorLink: "https://www.numericable.fr/",
  fields: {
    login: "text",
    password: "password",
    folderPath: "folder"
  },
  models: {
    bill: Bill
  },
  init: function(callback) {
    return callback();
  },
  fetch: function(requiredFields, callback) {
    log.info("Import started");
    return fetcher["new"]().use(logIn).use(parsePage).use(filterExisting(log, Bill)).use(saveDataAndFile(log, Bill, 'numericable', ['bill'])).use(linkBankOperation({
      log: log,
      model: Bill,
      identifier: 'numericable',
      dateDelta: 12
    })).args(requiredFields, {}, {}).fetch(function(err, fields, entries) {
      var localizationKey, notifContent, options, ref;
      log.info("Import finished");
      notifContent = null;
      if ((entries != null ? (ref = entries.filtered) != null ? ref.length : void 0 : void 0) > 0) {
        localizationKey = 'notification numericable';
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
  var appKeyOptions, billOptions, logInOptions, redirectOptions, signInOptions, tokenAuthOptions;
  appKeyOptions = {
    method: 'GET',
    jar: true,
    url: "https://moncompte.numericable.fr/pages/connection/Login.aspx"
  };
  logInOptions = {
    method: 'POST',
    jar: true,
    url: "https://connexion.numericable.fr/Oauth/Oauth.php",
    form: {
      'action': "connect",
      'linkSSO': "/pages/connection/Login.aspx?link=HOME",
      'appkey': "",
      'isMobile': ""
    }
  };
  redirectOptions = {
    method: 'POST',
    jar: true,
    url: "https://connexion.numericable.fr"
  };
  signInOptions = {
    method: 'POST',
    jar: true,
    url: "https://connexion.numericable.fr/Oauth/login/",
    form: {
      'login': requiredFields.login,
      'pwd': requiredFields.password
    }
  };
  tokenAuthOptions = {
    method: 'POST',
    jar: true,
    url: "https://moncompte.numericable.fr/pages/connection/Login.aspx?link=HOME",
    qs: {
      accessToken: ""
    }
  };
  billOptions = {
    method: 'GET',
    jar: true,
    uri: "https://moncompte.numericable.fr/pages/billing/Invoice.aspx"
  };
  log.info('Getting appkey');
  return request(appKeyOptions, function(err, res, body) {
    var $, appKey;
    if (err) {
      return next(err);
    }
    $ = cheerio.load(body);
    appKey = $('#PostForm input[name="appkey"]').attr("value");
    if (!appKey) {
      return next("Could not retrieve app key");
    }
    logInOptions.form.appkey = appKey;
    log.info('Logging in');
    return request(logInOptions, function(err, res, body) {
      if (err) {
        log.error('Login failed');
        return next(err);
      }
      log.info('Signing in');
      return request(signInOptions, function(err, res, body) {
        var redirectURL;
        if (err) {
          log.error('Signin failed');
          return next(err);
        }
        redirectURL = res.headers.location;
        if (!redirectURL) {
          return next("Could not retrieve redirect URL");
        }
        redirectOptions.url += redirectURL;
        log.info("Fetching access token");
        return request(redirectOptions, function(err, res, body) {
          var accessToken;
          if (err) {
            log.error('Token fetching failed');
            return next(err);
          }
          $ = cheerio.load(body);
          accessToken = $("#accessToken").attr("value");
          if (!accessToken) {
            return next("Could not retrieve access token");
          }
          tokenAuthOptions.qs.accessToken = accessToken;
          log.info("Authenticating by token");
          return request(tokenAuthOptions, function(err, res, body) {
            if (err) {
              log.error('Authentication by token failed');
              return next(err);
            }
            log.info('Fetching bills page');
            return request(billOptions, function(err, res, body) {
              if (err) {
                log.error('An error occured while fetching ' + 'bills page');
                return next(err);
              }
              data.html = body;
              return next();
            });
          });
        });
      });
    });
  });
};

parsePage = function(requiredFields, bills, data, next) {
  var $, baseURL, bill, billDate, billLink, billTotal, firstBill;
  bills.fetched = [];
  $ = cheerio.load(data.html);
  baseURL = "https://moncompte.numericable.fr";
  log.info('Parsing bill page');
  firstBill = $("#firstFact");
  billDate = firstBill.find("h2 span");
  billTotal = firstBill.find('p.right');
  billLink = firstBill.find('a.linkBtn');
  bill = {
    date: moment(billDate.html(), 'DD/MM/YYYY'),
    amount: parseFloat(billTotal.html().replace(' €', '').replace(',', '.')),
    pdfurl: baseURL + billLink.attr("href"),
    type: 'internet',
    vendor: 'Numéricable'
  };
  if ((bill.date != null) && (bill.amount != null) && (bill.pdfurl != null)) {
    bills.fetched.push(bill);
  }
  $('#facture > div[id!="firstFact"]').each(function() {
    billDate = $(this).find('h3').html().substr(3);
    billTotal = $(this).find('p.right');
    billLink = $(this).find('a.linkBtn');
    bill = {
      date: moment(billDate, 'DD/MM/YYYY'),
      amount: parseFloat(billTotal.html().replace(' €', '').replace(',', '.')),
      pdfurl: baseURL + billLink.attr('href'),
      type: 'internet',
      vendor: 'Numéricable'
    };
    if ((bill.date != null) && (bill.amount != null) && (bill.pdfurl != null)) {
      return bills.fetched.push(bill);
    }
  });
  log.info(bills.fetched.length + " bills retrieved");
  if (!bills.fetched.length) {
    return next("No bills retrieved");
  } else {
    return next();
  }
};
