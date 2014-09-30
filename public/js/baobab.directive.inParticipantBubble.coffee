
define ["angular", "blueimp-md5", "jQuery"], (angular, md5) ->
  angular.module('baobab.directive.inParticipantBubble', [])

  .directive 'inParticipantBubble', () ->
    restrict: "E"
    template: '<div class="participant-bubble"></div>'
    link: (scope, element, attrs, ctrl) ->
      email = attrs['email'].toLowerCase().trim()
      url = "http://www.gravatar.com/avatar/" + md5(email)+ "?d=blank"
      hue = 0
      for ii in [0..email.length-1] by 1
        hue += email.charCodeAt(ii)

      el = $(element).find('.participant-bubble')
      el.css('background-color', 'hsl('+hue+',70%,60%)')
      el.css('background-image', 'url('+url+')')
      el.css('background-size','cover')
