(function() {
  define(["angular", "blueimp-md5", "jQuery"], function(angular, md5) {
    return angular.module('baobab.directive.inParticipantBubble', []).directive('inParticipantBubble', function() {
      return {
        restrict: "E",
        template: '<div class="participant-bubble"></div>',
        link: function(scope, element, attrs, ctrl) {
          var el, email, hue, ii, url, _i, _ref;
          email = attrs['email'].toLowerCase().trim();
          url = "http://www.gravatar.com/avatar/" + md5(email) + "?d=blank";
          hue = 0;
          for (ii = _i = 0, _ref = email.length - 1; _i <= _ref; ii = _i += 1) {
            hue += email.charCodeAt(ii);
          }
          el = $(element).find('.participant-bubble');
          el.css('background-color', 'hsl(' + hue + ',70%,60%)');
          el.css('background-image', 'url(' + url + ')');
          return el.css('background-size', 'cover');
        }
      };
    });
  });

}).call(this);
