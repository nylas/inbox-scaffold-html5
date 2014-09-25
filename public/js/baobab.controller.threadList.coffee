
define ["angular", "underscore", "error"], (angular, _, error) ->
  angular.module("baobab.controller.threadlist", [])
  .controller('ThreadListCtrl', [
    '$scope', '$contacts', '$threads', '$location', '$routeParams',
    ($scope, $contacts, $threads, $location, $routeParams) ->

      setAutocomplete = (items) =>
        @autocomplete = items
        setAutocompleteSelection(items[0])


      setAutocompleteSelection = (item) =>
        @autocompleteSelection = item
        updateTypeaheadWithSelection()


      updateTypeaheadWithSelection = () =>
        contact = @autocompleteSelection
        term = $scope.search.toLowerCase()

        if (!contact || (term.length == 0))
          $scope.searchTypeahead = ''
        else if (term == contact.email.toLowerCase().substr(0,term.length))
          $scope.searchTypeahead = $scope.search + contact.email.substr($scope.search.length)
        else if (term == contact.name.toLowerCase().substr(0,term.length))
          $scope.searchTypeahead = $scope.search + contact.name.substr($scope.search.length)
        else
          $scope.searchTypeahead = ''

      $scope.search = $threads.filters()['any_email'] || ''
      $scope.searchTypeahead = ''
      $scope.$watch 'search', () ->
        updateAutocomplete()

      $threads.setFilters
        tag: $routeParams['tag'] || 'inbox'

      @list = $threads.list()
      @extendList = $threads.extendList

      $threads.on 'update', () =>
        @list = $threads.list()

      @viewName = $routeParams['tag']
      setAutocomplete([])

      # internal methods

      updateAutocomplete = () =>
        contacts = $contacts.list()
        term = $scope.search.toLowerCase()
        search = $threads.filters()['any_email']
        results = []

        # don't show autocompletions if the field is empty, or if the
        # field contents have already been applied to the $thread filters
        if (term.length == 0) || (search && (term.toLowerCase() == search.toLowerCase()))
          setAutocomplete([])
          return

        contacts.every (c) ->
          if (c.email.toLowerCase().indexOf(term) == 0) || (c.name.toLowerCase().indexOf(term) == 0)
            results.push(c)
          return results.length < 3

        setAutocomplete(results)

      # exposed methods

      @showNoMore = () =>
        $threads.listIsCompleteSet() && $threads.listIsMultiplePages()


      @tokenizedFilters = () =>
        filters = $threads.filters()
        delete filters['any_email']
        filters


      @threadClicked = (thread) =>
        $location.path('/thread/'+thread.id)


      @archiveClicked = (thread, event) =>
        thread.removeTags(['inbox']).then((response)->
          $threads.itemArchived(thread.id)
        , error._handleAPIError)

        event.stopPropagation()


      @searchClicked = () ->
        filters = {}
        search = $scope.search

        if search.indexOf(':') > 0
          _.each search.split(' '), (term) ->
            parts = term.split(':')
            if (parts.length == 2)
              filters[parts[0]] = parts[1]
              search = search.replace(term, '')
        else
          filters['any_email'] = search

        $threads.appendFilters(filters)
        $scope.search = search

        setAutocomplete([])


      @searchCleared = () ->
        $scope.search = ""
        $scope.searchFocused = false
        $threads.appendFilters({'any_email': null})


      @keypressInAutocomplete = (e) ->
        index = @autocomplete.indexOf(@autocompleteSelection)

        if (e.keyCode == 40) # down arrow
          if (@autocompleteSelection == null) || (index == -1)
            setAutocompleteSelection(@autocomplete[0])
          else if (index + 1 < @autocomplete.length)
            setAutocompleteSelection(@autocomplete[index+1])
          e.preventDefault()

        if (e.keyCode == 38) # up arrow
          setAutocompleteSelection(@autocomplete[index-1]) if index > 0
          e.preventDefault()

        if (e.keyCode == 39) # right arrow
          $scope.search = $scope.searchTypeahead

        if (e.keyCode == 13) # enter
          $scope.search = @autocompleteSelection.email if @autocompleteSelection
          @searchClicked()

        updateTypeaheadWithSelection()

      @
  ])


