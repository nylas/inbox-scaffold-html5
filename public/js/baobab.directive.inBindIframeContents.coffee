
define ["angular", "jQuery"], (angular) ->
  angular.module('baobab.directive.inBindIframeContents', [])

  .directive 'inBindIframeContents', () ->
    require: 'ngModel'
    link: (scope, element, attrs, ngModel) ->
      # Specify how UI should be updated
      ngModel.$render = () ->
        doc = element[0].contentWindow.document
        element[0].onload = () ->
          height = doc.body.scrollHeight + 'px'
          doc.body.className += ' ' + 'heightDetermined'
          $(element).height(height)
          scope.$emit('inIframeLoaded')

        style = $('#iframe-css').html()
        doc.open()
        doc.write(style)
        doc.write("<base target='_blank'>")
        doc.write(ngModel.$viewValue)
        doc.close()
