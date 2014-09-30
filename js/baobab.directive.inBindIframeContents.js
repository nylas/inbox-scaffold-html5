(function() {
  define(["angular", "jQuery"], function(angular) {
    return angular.module('baobab.directive.inBindIframeContents', []).directive('inBindIframeContents', function() {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
          return ngModel.$render = function() {
            var doc, style;
            doc = element[0].contentWindow.document;
            element[0].onload = function() {
              var height;
              height = doc.body.scrollHeight + 'px';
              doc.body.className += ' ' + 'heightDetermined';
              $(element).height(height);
              return scope.$emit('inIframeLoaded');
            };
            style = $('#iframe-css').html();
            doc.open();
            doc.write(style);
            doc.write("<base target='_blank'>");
            doc.write(ngModel.$viewValue);
            return doc.close();
          };
        }
      };
    });
  });

}).call(this);
