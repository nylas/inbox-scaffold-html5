
define ["angular"], (angular) ->
  angular.module('baobab.directive.inParticipants', [])

  .directive 'inParticipants', () ->
    format = (value) ->
      if (value && Object.prototype.toString.call(value) == '[object Array]')
        str = ''
        for i in [0..value.length-1] by 1
          p = value[i]
          if p && typeof p == 'object' && p.email
            str += ', ' if str.length
            str += p.email
        str


    parse = (value) ->
      if typeof value == 'string'
        values = value.split(/\s*,\s*/)
        out = []
        for value in values
          out.push
            name: ''
            email: value[i]
        out


    return {
      require: 'ngModel'
      link: (scope, element, attrs, ngModel) ->
        ngModel.$formatters.push(format)
        ngModel.$parsers.push(parse)
    }