define ['angular', 'angularMocks', 'baobab.controller.thread'], (angular) ->
  describe 'ThreadCtrl', ->
    $scope = null
    $me = null
    controller = null
    promises = null
    msg = null
    downloadPromise = null
    mockThread1 =
      'id': 'fake_thread_id1',
      'object': 'thread',
      'namespace_id': 'fake_namespace_id',
      'subject': 'Mock Thread 1',
      'last_message_timestamp': 1398229259,
      'participants': [
        {
          'name': 'Ben Bitdiddle',
          'email': 'ben.bitdiddle@gmail.com'
        },
        {
          'name': 'Bill Rogers',
          'email': 'wrogers@mit.edu'
        }
      ],
      'snippet': 'Test thread 1...',
      'tags': [
        {
          'name': 'inbox',
          'id': 'f0idlvozkrpj3ihxze7obpivh',
          'object': 'tag'
        },
        {
          'name': 'unread',
          'id': '8keda28h8ijj2nogpj83yjep8',
          'object': 'tag'
        }
      ],
      'message_ids': [
        '251r594smznew6yhiocht2v29',
        '7upzl8ss738iz8xf48lm84q3e',
        'ah5wuphj3t83j260jqucm9a28'
      ],
      'draft_ids': []
      'messages': () ->
        then: (callback) ->
          callback([])
      'hasTag': () -> false
      'drafts': () ->
        then: (callback) ->
          callback([])


    beforeEach ->
      `Promise = mockPromises.getMockPromise(Promise);`
      angular.mock.module 'baobab.controller.thread'

      $me =
        emailAddress: -> "ben@inboxapp.com"

      $threads =
        item: -> mockThread1

      angular.mock.inject ($rootScope, $controller) ->
        $scope = $rootScope.$new()
        controller = $controller 'ThreadCtrl',
          $scope: $scope
          $me: $me,
          $threads: $threads,
          $namespace: null,
          $modal: null,
          $scrollState: null,
          $routeParams: {'id': 'fake_thread_id1'}


    afterEach ->
      `Promise = mockPromises.getOriginalPromise();`


    describe 'viewAttachment()', ->
      beforeEach ->
        blob = new Blob(['<b>123</b>'], {type : 'text/html'})
        downloadPromise = Promise.resolve(blob)

        msg = null
        msg =
          attachment: () -> msg
          download: () -> downloadPromise


      it 'should download the attachment blob', ->
        spyOn(msg, 'download').andReturn(downloadPromise)
        mockPromises.executeForPromise(downloadPromise)
        controller.viewAttachment(msg, 'bs')
        expect(msg.download).toHaveBeenCalled()

      it 'should not immediately download attachments that are images', ->
        blob = new Blob(['23232323'], {type : 'image/png'})
        downloadPromise = Promise.resolve(blob)

        spyOn(controller, 'downloadCurrentAttachment')
        controller.viewAttachment(msg, 'bs')
        mockPromises.executeForPromise(downloadPromise)
        expect(controller.downloadCurrentAttachment).not.toHaveBeenCalled()


      it 'should immediately save attachments that are not images', ->
        spyOn(controller, 'downloadCurrentAttachment')
        controller.viewAttachment(msg, 'bs')
        mockPromises.executeForPromise(downloadPromise)
        expect(controller.downloadCurrentAttachment).toHaveBeenCalled()

    describe 'hideAttachment()', ->
      it 'should reset the attachment state', ->
        controller.currentAttachmentDataURL = 'bla'
        controller.currentAttachment = 'bla'
        controller.hideAttachment()
        expect(controller.currentAttachmentDataURL).toBe(null);
        expect(controller.currentAttachment).toBe(null);
