"use strict";
define(["angular", "underscore", "moment"], function (angular, _, moment) {

  angular.module("baobab.filter", [])

  .filter('shorten', function() {
    return function(input) {
      if (typeof input === 'string' && input.length > 64) {
        return input.substring(0, 60) + ' ...';
      }
      return input;
    };
  })

  .filter('tag_expand', function() {
    return function(input) {
        var tags="";
        for (var index = 0; index < input.length; ++index) {
            tags += input[index].name + " ";
        }
        return tags;
    };
  })

  .filter('pretty_size', function() {
    return function(filesize) {
      if(filesize < 1000)
        return filesize + " B";
      if(filesize < 1000000)
        return Math.floor(filesize/1000) + " KB";
      else
        return Math.floor(filesize/1000000) + " MB";
    };
  })

  .filter('participants', ['$me', function($me) {
    return function(participants, preset) {
      var meParts = $me.emailAddress().split('@');
      var str = '';

      preset = preset || 'short';

      _.each(participants, function(participant) {
        // If we are the participant, show "Me" instead of our name
        var name = participant.name;
        if (participant.email == $me.emailAddress())
          name = 'Me';

        // If there are only two participants, and we're one of them,
        // just show the other participant's name.
        if ((participants.length == 2) && (name == 'Me'))
          return;

        // If no name is provided, use the email address
        if (_.isEmpty(name)) {
          name = participant.email;
          var parts = name.split('@');

          if (preset == 'short') {
            // If the name contains the user's domain name, strip it out
            // team@inboxapp.com => team
            if (parts[1] == meParts[1])
              name = parts[0];

            // If the participant is an automated responder, show the email domain
            else if (_.contains(['support', 'no-reply', 'info'], parts[0]))
              name = parts[1];
          }
        }

        if (preset == 'short') {
          // If the name contains parenthesis "Inbox Support (Ben Gotow)", trim it
          // to the contents of the parenthesis
          if (name.indexOf('(') > 0) {
            var start = name.indexOf('(') + 1;
            var end = name.indexOf(')');
            name = name.substr(start, end-start);
          }
        }

        // Append the name to the output string
        str += str ? ', ' + name : name;
      });

      return str;
    };
  }])

  .filter('timestamp_ago', function() {
    return function(date) {
      return moment(date).fromNow();
    };
  })

  .filter('timestamp_short', function(){
    return function(_date){
      var date = moment(_date);
      var dateYear = date.format('YYYY')/1;
      var nowYear = moment().format('YYYY')/1;
      var dateDay = date.format('DDD')/1 + 365 * dateYear;
      var nowDay = moment().format('DDD')/1 + 365 * nowYear;

      if (dateDay == nowDay)
        return date.format('h:mma');
      else if (nowDay - dateDay < 7)
        return date.format('dddd, h:mma');
      else if (nowYear == dateYear)
        return date.format('MMM Do');
      else
        return date.format('M/D/YYYY');
    };
  })

  .filter('extension', function() {
    return function(filename) {
      var parts = filename.split('.');
      if (parts.length > 1)
        return parts[parts.length-1];
      else
        return "";
    };
  })

  .filter('type_to_glyph', function() {
    return function(type) {
      if(type == "application/pdf") {
        return "book";
      } else if(type.match(/image/)) {
        return "picture";
      } else if(type.match(/audio/)) {
        return "music";
      } else if(type.match(/video/)) {
        return "video";
      } else if(type.match(/text/)) {
        return "list-alt";
      } else if(type == "application/gzip") {
        return "compressed";
      } else {
        return "file";
      }
    };
  })

  .filter('attachment_type_to_glyph', function() {
    return function(input) {
      var type = input.contentType;
      if(typeof type === "undefined") {
        return "file";
      }

      if(type == "application/pdf") {
        return "book";
      } else if(type.match(/image/)) {
        return "picture";
      } else if(type.match(/audio/)) {
        return "music";
      } else if(type.match(/video/)) {
        return "video";
      } else if(type.match(/text/)) {
        return "list-alt";
      } else if(type == "application/gzip") {
        return "compressed";
      } else {
        return "file";
      }
    };
  });

});
