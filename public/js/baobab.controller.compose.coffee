define ["angular", "underscore"], (angular, _) ->
  angular.module("baobab.controller.compose", [])
  .controller 'ComposeCtrl', ($scope, $auth, $namespaces, $contacts) ->
    self = this # Controller at creation time. `this` changes to Window later!

    clearDraft = ->
      $scope.$emit("compose-cleared")
      self.reply = false
      $scope.cc = false
      setDraft $namespaces.current().draft()
      return

    setDraft = (draft) ->
      setAttachments draft.attachments()
      self.draft = draft
      self.draft.to = self.draft.to || [] # Gross
      self.draft.cc = self.draft.cc || []
      self.draft.bcc = self.draft.bcc || []
      self.draft.fileData = self.draft.fileData || []
      if !_.isEmpty(self.draft.cc) || !_.isEmpty(self.draft.bcc)
        $scope.cc = true
      $scope.$emit "compose-active"
      return

    setAttachments = -> # noop
    clearDraft()

    @completionOptions =
      complete: (search) ->
        if _.isEmpty(search)
          return []
        $contacts.list().filter (contact) ->
          !_.isEmpty(contact.email) && (contact.email.toLowerCase().indexOf(search.toLowerCase()) == 0 ||
          !_.isEmpty(contact.name) && contact.name.toLowerCase().indexOf(search.toLowerCase()) == 0)
      parse: (text) ->
        candidates = $contacts.list().filter (contact) ->
          !_.isEmpty(contact.email) && contact.email.toLowerCase() == text.toLowerCase()

        if (candidates.length == 1)
          candidates[0]
        else
          email: text

    @discardClicked = ->
      self.draft.dispose().then ->
        $scope.$emit("compose-discard")
        clearDraft()
        return

    @sendClicked = ->
      self.draft.save().then ->
        $scope.$emit("compose-saved")
        self.draft.send().then ->
          $scope.$emit("compose-sent")
          clearDraft()
          return

    @leaveClicked = ->
      self.draft.save().then ->
        $scope.$emit("compose-saved")
        $scope.$emit("compose-cleared")
        self.draft = null
        return

    $scope.$on "compose-set-draft", (event, draft) ->
      setDraft(draft)
      self.reply = _.isString(draft.thread)
      $scope.$emit("compose-replying")
      return

    $scope.$on "$destroy", ->
      if (_.isEmpty(self.draft.to) && _.isEmpty(self.draft.from) && _.isEmpty(self.draft.cc) &&
          _.isEmpty(self.draft.bcc) && _.isEmpty(self.draft.subject) && _.isEmpty(self.draft.body))
        return
      console.log("Saving...")
      self.draft.save().then -> console.log("Saved.")
      return

    @dropzoneConfig =
      options:
        'url': $namespaces.current().resourceUrl() + '/files'
        'autoProcessQueue': true
        'headers':
          'Authorization': 'Basic '+btoa($auth.token+':')
        'addRemoveLinks': true
        'previewsContainer': '.dropzone-previews'
        'createImageThumbnails': false
        'dictFallbackText': null
        'dictRemoveFile': '✘'
        'previewTemplate': """
          <div class="dz-preview dz-file-preview">
            <a class="attachment">
              <div class="pull-left file-type-icon"><span class="corner"></span><span class="type"></span></div>
              <div class="pull-left file-name dz-filename"><span data-dz-name></span></div>
            </a>
            <div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress=""></span></div>
          </div>
          """

      eventHandlers:
        success: (file, response, e) ->
          self.draft.addAttachment(response[0])
        removedfile: (file) ->
          self.draft.removeAttachment(file)

      dropzoneReady: (dropzone) ->
        setAttachments = (newFiles) ->
          dropzone.removeAllFiles(true)
          _.forEach newFiles, (file) ->
            file.name = file.filename
            dropzone.putFile(file)

    return
  return


