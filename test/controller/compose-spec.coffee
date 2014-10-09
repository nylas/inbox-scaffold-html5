define ['angular', 'baobab.controller.compose', 'angularMocks', 'angular-inbox'], (angular) ->
  describe 'ComposeCtrl', ->
    $scope = null
    controller = null
    promises = null
    InboxAPI = null
    $auth =
      token: 'fake auth token'
    mockDraft1 =
      'id': '84umizq7c4jtrew491brpa6iu',
      'namespace': 'fake_namespace_id',
      'object': 'message',
      'subject': 'Re: Dinner on Friday?',
      'from': [
        {
        'name': 'Ben Bitdiddle',
        'email': 'ben.bitdiddle@gmail.com'
        }
      ],
      'to': [
        {
        'name': 'Bill Rogers',
        'email': 'wbrogers@mit.edu'
        }
      ],
      'cc': [],
      'bcc': [],
      'date': 1370084645,
      'thread': '5vryyrki4fqt7am31uso27t3f',
      'files': [
        {
        'content_type': 'image/jpeg',
        'filename': 'walter.jpg',
        'id': '7jm8bplrg5tx0c7pon56tx30r',
        'size': 38633
        }
      ],
      'body': '<html><body>....</body></html>',
      'unread': true
      'send': -> null
      'save': -> null
      'dispose': -> null

    beforeEach ->
      `Promise = mockPromises.getMockPromise(Promise);`

      $namespaces =
        current: ->
            draft: ->
              new InboxAPI.INDraft null, mockDraft1, "fake_namespace_id"
            resourceUrl: ->
              'fakeresource.inboxapp.com/n/fakenamespace'

      angular.mock.module 'baobab.controller.compose', 'inbox', ($provide, $inboxProvider) ->
        $inboxProvider.appId('baobabtestingfakeappid')
        InboxAPI = $inboxProvider.InboxAPI
        $provide.value '$namespaces', $namespaces
        return

      angular.mock.inject ($rootScope, $controller) ->
        $scope = $rootScope.$new()
        controller = $controller 'ComposeCtrl',
          $scope: $scope,
          $contacts: null,
          $auth: $auth,
          $routeParams: {}
        return

      promises =
        save: Promise.resolve(controller.draft)
        send: Promise.resolve(null)
        dispose: Promise.resolve(null)

      spyOn(controller.draft, 'save').andReturn promises.save
      spyOn(controller.draft, 'send').andReturn promises.send
      spyOn(controller.draft, 'dispose').andReturn promises.dispose
      return

    afterEach ->
      `Promise = mockPromises.getOriginalPromise();`
      return

    it 'should create a draft on load', ->
      expect(controller.draft).toBeDefined()

    it 'should create a draft on discardClicked', ->
      controller.discardClicked()
      expect(controller.draft.dispose).toHaveBeenCalled()

    it 'should save and send on sendClicked', ->
      controller.sendClicked()
      mockPromises.executeForPromise(promises.save)
      expect(controller.draft.save).toHaveBeenCalled()
      expect(controller.draft.send).toHaveBeenCalled()

    it 'should save on leaveClicked', ->
      save = controller.draft.save
      controller.leaveClicked()
      mockPromises.executeForPromise(promises.save)
      expect(save).toHaveBeenCalled()
      expect(controller.draft).toBeNull()

    it 'should have a success handler which updates the draft', ->
      controller.draft = new InboxAPI.INDraft(null, { files: [], id: '-selfdefined' })
      expect(controller.draft.fileData).toEqual([])
      controller.dropzoneConfig.eventHandlers.success(null, [mockDraft1.files[0]])
      attachments = controller.draft.attachments()
      expect(mockDraft1.files[0].id).toBeDefined()
      expect(attachments.length).toEqual 1
      expect(attachments[0].id).toEqual(mockDraft1.files[0].id)

    it 'should have a ready handler which resets the file upload object on a new draft', ->
      expect(controller.dropzoneConfig.dropzoneReady).toBeDefined()
      fakeDropzone =
        removeAllFiles: -> null
      spyOn(fakeDropzone, 'removeAllFiles')
      controller.dropzoneConfig.dropzoneReady(fakeDropzone)
      $scope.$emit('compose-set-draft', new InboxAPI.INDraft())
      expect(fakeDropzone.removeAllFiles).toHaveBeenCalled()

    it 'should display files which already existed when loading a draft', ->
      expect(controller.dropzoneConfig.dropzoneReady).toBeDefined()
      fakeDropzone =
        removeAllFiles: -> null
        files: []
        putFile: (file) -> @files.push(file)
      controller.dropzoneConfig.dropzoneReady(fakeDropzone)
      draft = new InboxAPI.INDraft(null, { files: mockDraft1.files })
      $scope.$emit('compose-set-draft', draft)
      expect(fakeDropzone.files.length).toEqual(1)
      expect(fakeDropzone.files[0].id).toEqual(mockDraft1.files[0].id)
      expect(fakeDropzone.files[0]).not.toEqual(mockDraft1.files[0]) # No mutation

    it 'should unattach a file the user removed', ->
      fakeDropzone =
        removeAllFiles: -> @files = []
        files: undefined
      controller.dropzoneConfig.dropzoneReady(fakeDropzone)
      controller.draft = new InboxAPI.INDraft(null, { files: mockDraft1.files })
      expect(controller.draft.attachments().length).toEqual(1)
      controller.dropzoneConfig.eventHandlers.removedfile(mockDraft1.files[0])
      expect(controller.draft.attachments().length).toEqual(0)
