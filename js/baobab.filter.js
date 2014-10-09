(function() {
  define(["angular", "underscore", "moment"], function(angular, _, moment) {
    return angular.module("baobab.filter", []).filter('shorten', function() {
      return function(input) {
        if (typeof input === 'string' && input.length > 64) {
          return input.substring(0, 60) + ' ...';
        } else {
          return input;
        }
      };
    }).filter('tag_expand', function() {
      return function(input) {
        var item, tags, _i, _len;
        tags = "";
        for (_i = 0, _len = input.length; _i < _len; _i++) {
          item = input[_i];
          tags += item.name + " ";
        }
        return tags;
      };
    }).filter('pretty_size', function() {
      return function(filesize) {
        if (filesize < 1000) {
          return "" + filesize + " B";
        }
        if (filesize < 1000000) {
          return "" + (Math.floor(filesize / 1000)) + " KB";
        } else {
          return "" + (Math.floor(filesize / 1000000)) + " MB";
        }
      };
    }).filter('participants', [
      '$namespaces', function($namespaces) {
        return function(participants, preset) {
          var meEmail, meParts, str;
          meEmail = $namespaces.current().emailAddress;
          meParts = meEmail.split('@');
          str = '';
          preset = preset || 'short';
          participants.forEach(function(participant) {
            var end, name, parts, start;
            name = participant.name;
            if (participant.email === meEmail) {
              name = 'Me';
            }
            if (participants.length === 2 && name === 'Me') {
              return;
            }
            if (_.isEmpty(name)) {
              name = participant.email;
              parts = name.split('@');
              if (preset === 'short') {
                if (parts[1] === meParts[1]) {
                  name = parts[0];
                } else if (_.contains(['support', 'no-reply', 'info'], parts[0])) {
                  name = parts[1];
                }
              }
            }
            if (preset === 'short') {
              if (name.indexOf('(') > 0) {
                start = name.indexOf('(') + 1;
                end = name.indexOf(')');
                name = name.substr(start, end - start);
              }
            }
            if (str.length) {
              str += ', ';
            }
            return str += name;
          });
          return str;
        };
      }
    ]).filter('not_me', function($namespaces) {
      return function(participants) {
        var me;
        me = $namespaces.current().emailAddress;
        return participants.filter(function(participant) {
          return participant.email !== me;
        });
      };
    }).filter('timestamp_ago', function() {
      return function(date) {
        return moment(date).fromNow();
      };
    }).filter('timestamp_short', function() {
      return function(_date) {
        var date, dateDay, dateYear, nowDay, nowYear;
        date = moment(_date);
        dateYear = date.format('YYYY') / 1;
        nowYear = moment().format('YYYY') / 1;
        dateDay = date.format('DDD') / 1 + 365 * dateYear;
        nowDay = moment().format('DDD') / 1 + 365 * nowYear;
        if (dateDay === nowDay) {
          return date.format('h:mma');
        } else if (nowDay - dateDay < 7) {
          return date.format('dddd, h:mma');
        } else if (nowYear === dateYear) {
          return date.format('MMM Do');
        } else {
          return date.format('M/D/YYYY');
        }
      };
    }).filter('extension', function() {
      return function(filename) {
        var parts;
        parts = filename.split('.');
        if (parts.length > 1) {
          return parts[parts.length - 1];
        } else {
          return "";
        }
      };
    }).filter('type_to_glyph', function() {
      return function(type) {
        if (type === "application/pdf") {
          return "book";
        } else if (type.match(/image/)) {
          return "picture";
        } else if (type.match(/audio/)) {
          return "music";
        } else if (type.match(/video/)) {
          return "video";
        } else if (type.match(/text/)) {
          return "list-alt";
        } else if (type === "application/gzip") {
          return "compressed";
        } else {
          return "file";
        }
      };
    }).filter('attachment_type_to_glyph', function() {
      return function(input) {
        var type;
        type = input.contentType;
        if (typeof type === "undefined") {
          return "file";
        }
        if (type === "application/pdf") {
          return "book";
        } else if (type.match(/image/)) {
          return "picture";
        } else if (type.match(/audio/)) {
          return "music";
        } else if (type.match(/video/)) {
          return "video";
        } else if (type.match(/text/)) {
          return "list-alt";
        } else if (type === "application/gzip") {
          return "compressed";
        } else {
          return "file";
        }
      };
    });
  });

}).call(this);
