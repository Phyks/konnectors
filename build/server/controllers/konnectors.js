// Generated by CoffeeScript 1.9.3
var Konnector, NotificationHelper, handleNotification, konnectorHash, localization, log, notification;

Konnector = require('../models/konnector');

localization = require('../lib/localization_manager');

NotificationHelper = require('cozy-notifications-helper');

notification = new NotificationHelper('konnectors');

konnectorHash = require('../lib/konnector_hash');

log = require('printit')({
  prefix: 'konnector controller'
});

module.exports = {
  getKonnector: function(req, res, next) {
    return Konnector.find(req.params.konnectorId, function(err, konnector) {
      if (err) {
        return next(err);
      } else if (konnector == null) {
        return res.send(404);
      } else {
        konnector.injectEncryptedFields();
        req.konnector = konnector;
        return next();
      }
    });
  },
  show: function(req, res, next) {
    return res.send(req.konnector);
  },
  remove: function(req, res, next) {
    var data;
    data = {
      lastAutoImport: null,
      fieldValues: {},
      password: '{}'
    };
    return req.konnector.updateAttributes(data, function(err, konnector) {
      if (err) {
        return next(err);
      }
      return res.status(204).send(konnector);
    });
  },
  "import": function(req, res, next) {
    var date;
    if (req.konnector.isImporting) {
      return res.send(400, {
        message: 'konnector is importing'
      });
    } else {
      if (req.body.fieldValues.date != null) {
        if (req.body.fieldValues.date !== '') {
          date = req.body.fieldValues.date;
        }
        delete req.body.fieldValues.date;
      }
      return req.konnector.updateFieldValues(req.body, function(err) {
        var poller;
        if (err != null) {
          return next(err);
        } else {
          poller = require("../lib/poller");
          poller.add(date, req.konnector);
          if (date == null) {
            req.konnector["import"](function(err, notifContent) {
              if (err != null) {
                return log.error(err);
              } else {
                return handleNotification(req.konnector, notifContent);
              }
            });
          }
          return res.status(200).send({
            success: true
          });
        }
      });
    }
  }
};

handleNotification = function(konnector, notifContent) {
  var model, notificationSlug, prefix;
  notificationSlug = konnector.slug;
  model = konnectorHash[konnector.slug];
  if (notifContent != null) {
    prefix = localization.t('notification prefix', {
      name: model.name
    });
    return notification.createOrUpdatePersistent(notificationSlug, {
      app: 'konnectors',
      text: prefix + " " + notifContent,
      resource: {
        app: 'konnectors',
        url: "konnector/" + konnector.slug
      }
    }, function(err) {
      if (err != null) {
        return log.error(err);
      }
    });
  }
};
