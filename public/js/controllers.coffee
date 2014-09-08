# Helpers
_clone = window._clone = (obj) ->
  JSON.parse JSON.stringify(obj)

_displayErrors = true
window.onbeforeunload = ->
  _displayErrors = false
  return

_handleAPIError = window._handleAPIError = (error) ->
  return  unless _displayErrors
  msg = "An unexpected error occurred. (HTTP code " + error["status"] + "). Please try again."
  msg = error["message"]  if error["message"]
  alert msg
  return


# Controllers

# internal methods
#oldest -> newest

# scroll to the first unread message, or the last message
# if the entire conversation is read.

# mark the thread as read
# oldest-newest

# exposed methods
# Self-emails are people too
# We know self.draft is set by now
angular.module("baobab.controllers", ["inbox","ngSanitize","ngCookies"])

.controller("AppCtrl", ["$scope", "$me","$inbox","$auth","$location","$cookieStore","$sce", ($scope, $me, $inbox, $auth, $location, $cookieStore, $sce) ->
  window.AppCtrl = this
  @inboxAuthURL = $sce.trustAsResourceUrl("https://beta.inboxapp.com/oauth/authorize")
  @inboxClientID = $inbox.appId()
  @inboxRedirectURL = window.location.protocol + "//" + window.location.host + "/"
  @loginHint = ""
  @clearToken = $auth.clearToken
  @token = ->
    $auth.token

  @namespace = ->
    $me._namespace

  @theme = $cookieStore.get("baobab_theme") or "light"
  @setTheme = (theme) =>
    @theme = theme
    $cookieStore.put "baobab_theme", theme
    return

  @cssForTab = (path) ->
    (if ($location.path().indexOf(path) isnt -1) then "active" else "")

  @
])

.controller("ComposeCtrl", ["$scope","$me",($scope, $me) ->
  clearDraft = ->
    $scope.$emit "compose-cleared"
    $me.namespacePromise.then ($namespace) ->
      self.reply = false
      self.draft = $namespace.draft()
      $scope.$emit "compose-active"
      return

    return
  self = this
  self.reply = false
  clearDraft()
  @discardClicked = ->
    self.draft.dispose().then ->
      $scope.$emit "compose-discard"
      clearDraft()
      return

    return

  @sendClicked = ->
    self.draft.save().then ->
      $scope.$emit "compose-saved"
      self.draft.send().then ->
        $scope.$emit "compose-sent"
        clearDraft()
        return

      return

    return

  @leaveClicked = ->
    self.draft.save().then ->
      $scope.$emit "compose-saved"
      $scope.$emit "compose-cleared"
      self.draft = null
      return

    return

  $scope.$on "compose-set-draft", (event, draft) ->
    self.draft = draft
    self.reply = _.isString(draft.thread)
    $scope.$emit "compose-replying"
    $scope.$emit "compose-active"
    return
  
  @
])

.controller("ThreadCtrl", [
  "$scope"
  "$namespace"
  "$threads"
  "$modal"
  "$routeParams"
  "$location"
  "$scrollState"
  "$me"
  ($scope, $namespace, $threads, $modal, $routeParams, $location, $scrollState, $me) ->
    threadReady = ->
      self.thread.messages().then ((messages) ->
        self.messages = messages.sort((a, b) ->
          a.date.getTime() - b.date.getTime()
        )
        scrollTo = messages[messages.length - 1]
        ii = 0

        while ii < messages.length
          if messages[ii].unread
            scrollTo = messages[ii]
            break
          ii++
        $scrollState.scrollTo "msg-" + scrollTo.id
        if self.thread.hasTag("unread")
          self.thread.removeTags(["unread"]).then ((response) ->
            ii = 0

            while ii < messages.length
              messages[ii].unread = false
              ii++
            return
          ), _handleAPIError
        return
      ), _handleAPIError
      self.thread.drafts().then ((drafts) ->
        self.drafts = drafts.sort((a, b) ->
          a.date.getTime() - b.date.getTime()
        )
        return
      ), _handleAPIError
      return
    self = this
    @thread = $threads.item($routeParams["id"])
    @messages = null
    @drafts = null
    $scope.replying = false
    @currentAttachment = null
    @currentAttachmentDataURL = null
    if @thread
      threadReady()
    else
      $namespace.thread($routeParams["id"]).then ((thread) ->
        self.thread = thread
        threadReady()
        return
      ), _handleAPIError
    @viewAttachment = (msg, id) ->
      self.currentAttachmentLoading = true
      msg.attachment(id).download().then (blob) ->
        self.currentAttachment = blob
        unless blob.type.indexOf("image/") is -1
          fileReader = new FileReader()
          fileReader.onload = ->
            self.currentAttachmentDataURL = @result
            self.currentAttachmentLoading = false
            $scope.$apply()  unless $scope.$$phase
            return

          fileReader.readAsDataURL blob
        else
          self.currentAttachmentLoading = false
          self.downloadCurrentAttachment()
        return

      return

    @hideAttachment = ->
      self.currentAttachmentDataURL = null
      return

    @downloadCurrentAttachment = ->
      saveAs self.currentAttachment, self.currentAttachment.fileName
      return

    @replyClicked = ->
      unless $scope.replying
        draft = self.draft = self.thread.reply()
        me = $me.emailAddress()
        participants = _.reject(self.thread.participants, (p) ->
          p.email is me
        )
        participants = self.thread.participants  if _.isEmpty(participants)
        draft.addRecipients participants
        $scope.$broadcast "compose-set-draft", draft
      else $scope.replying = false  if _.isEmpty(self.draft.body)
      return

    @draftClicked = (msg) ->
      self.draft = msg
      $scope.$broadcast "compose-set-draft", msg
      return

    @archiveClicked = ->
      self.thread.removeTags(["inbox"]).then ((response) ->
        $threads.itemArchived self.thread.id
        $location.path "/inbox"
        return
      ), _handleAPIError
      return

    $scope.$on "compose-replying", (event) ->
      $scope.replying = true
      return

    $scope.$on "compose-cleared", (event) ->
      self.draft = null
      $scope.replying = false
      return

    @

]).controller "ThreadListCtrl", [
  "$scope"
  "$me"
  "$threads"
  "$modal"
  "$location"
  "$routeParams"
  ($scope, $me, $threads, $modal, $location, $routeParams) ->
    
    # internal methods
    updateAutocomplete = ->
      contacts = $me.contacts()
      term = $scope.search.toLowerCase()
      search = $threads.filters()["any_email"]
      results = []
      
      # don't show autocompletions if the field is empty, or if the
      # field contents have already been applied to the $thread filters
      if (term.length is 0) or (search and (term.toLowerCase() is search.toLowerCase()))
        setAutocomplete []
        return
      ii = 0

      while ii < contacts.length
        results.push contacts[ii]  if (contacts[ii].email.toLowerCase().indexOf(term) is 0) or (contacts[ii].name.toLowerCase().indexOf(term) is 0)
        break  if results.length is 3
        ii++
      setAutocomplete results
      return
    updateTypeaheadWithSelection = ->
      contact = self.autocompleteSelection
      term = $scope.search.toLowerCase()
      if not contact or (term.length is 0)
        $scope.searchTypeahead = ""
      else if term is contact.email.toLowerCase().substr(0, term.length)
        $scope.searchTypeahead = $scope.search + contact.email.substr($scope.search.length)
      else if term is contact.name.toLowerCase().substr(0, term.length)
        $scope.searchTypeahead = $scope.search + contact.name.substr($scope.search.length)
      else
        $scope.searchTypeahead = ""
      return
    setAutocomplete = (items) ->
      self.autocomplete = items
      setAutocompleteSelection items[0]
      return
    setAutocompleteSelection = (item) ->
      self.autocompleteSelection = item
      updateTypeaheadWithSelection()
      return
    self = this
    $scope.search = $threads.filters()["any_email"] or ""
    $scope.searchTypeahead = ""
    $scope.$watch "search", ->
      updateAutocomplete()
      return

    $threads.setFilters tag: $routeParams["tag"] or "inbox"
    @list = $threads.list()
    @extendList = $threads.extendList
    $threads.on "update", ->
      self.list = $threads.list()
      return

    @viewName = $routeParams["tag"]
    setAutocomplete []
    
    # exposed methods
    @showNoMore = ->
      $threads.listIsCompleteSet() and $threads.listIsMultiplePages()

    @tokenizedFilters = ->
      filters = $threads.filters()
      delete filters["any_email"]

      filters

    @threadClicked = (thread) ->
      $location.path "/thread/" + thread.id
      return

    @archiveClicked = (thread, event) ->
      thread.removeTags(["inbox"]).then ((response) ->
        $threads.itemArchived thread.id
        return
      ), _handleAPIError
      event.stopPropagation()
      return

    @searchClicked = ->
      filters = {}
      search = $scope.search
      if search.indexOf(":") > 0
        _.each search.split(" "), (term) ->
          parts = term.split(":")
          if parts.length is 2
            filters[parts[0]] = parts[1]
            search = search.replace(term, "")
          return

      else
        filters["any_email"] = search
      $threads.appendFilters filters
      $scope.search = search
      setAutocomplete []
      return

    @searchCleared = ->
      $scope.search = ""
      $scope.searchFocused = false
      $threads.appendFilters any_email: null
      return

    @keypressInAutocomplete = (e) ->
      index = self.autocomplete.indexOf(self.autocompleteSelection)
      if e.keyCode is 40 # down arrow
        if (not (self.autocompleteSelection?)) or (index is -1)
          setAutocompleteSelection self.autocomplete[0]
        else setAutocompleteSelection self.autocomplete[index + 1]  if index + 1 < self.autocomplete.length
        e.preventDefault()
      if e.keyCode is 38 # up arrow
        setAutocompleteSelection self.autocomplete[index - 1]  if index > 0
        e.preventDefault()
      # right arrow
      $scope.search = $scope.searchTypeahead  if e.keyCode is 39
      if e.keyCode is 13 # enter
        $scope.search = self.autocompleteSelection.email  if self.autocompleteSelection
        self.searchClicked()
      updateTypeaheadWithSelection()
      return

    @
]