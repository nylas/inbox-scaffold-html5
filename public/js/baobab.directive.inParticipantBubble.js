"use strict";
define(["angular", "jQuery"], function (angular) {
  angular.module('baobab.directive.inParticipantBubble', [])

  .directive('inParticipantBubble', [function() {
    return {
        restrict: "E",
        template: '<div class="participant-bubble"></div>',
        link: function(scope, element, attrs, ctrl) {
          var email = attrs['email'].toLowerCase().trim();
          var url = "/avatar/"+email;
          var hue = 0;
          for (var ii = 0; ii < email.length; ii++)
            hue += email.charCodeAt(ii);

          var el = $(element).find('.participant-bubble');
          el.css('background-color', 'hsl('+hue+',70%,60%)');
          el.css('background-image', 'url('+url+')');
          el.css('background-size','cover');
        }
    };
  }]);
});
