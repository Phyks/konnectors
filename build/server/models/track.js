// Generated by CoffeeScript 1.10.0
var Track, americano, log;

americano = require('cozydb');

log = require('printit')({
  prefix: 'konnectors'
});

Track = americano.getModel('Track', {
  metas: Object,
  ressource: Object,
  playlists: [String],
  dateAdded: Date,
  plays: Number,
  hidden: Boolean
});

Track.createFromFile = function(trackName, fileID, callback) {
  var data;
  data = {
    metas: {
      title: trackName
    },
    ressource: {
      type: 'file',
      fileID: fileID
    },
    playlists: [],
    dateAdded: new Date(),
    plays: 0,
    hidden: false
  };
  return Track.create(data, function(err, newTrack) {
    if (err) {
      log.error(err);
      return callback(err);
    } else {
      return callback(null);
    }
  });
};

module.exports = Track;
