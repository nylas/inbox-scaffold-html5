"use strict";
var Baobab, $; // globals

Baobab.
directive('inBindIframeContents', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      // Specify how UI should be updated
      ngModel.$render = function() {
        var doc = element[0].contentWindow.document;
        element[0].onload = function() {
          var height = doc.body.scrollHeight + 'px';
          doc.body.className += ' ' + 'heightDetermined';
          $(element).height(height);
          scope.$emit('inIframeLoaded');
        };
        var style = $('#iframe-css').html();
        doc.open();
        doc.write(style);
        doc.write(ngModel.$viewValue);
        doc.close();
      };
    }
  };
});