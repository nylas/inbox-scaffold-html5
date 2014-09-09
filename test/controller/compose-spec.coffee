describe 'ComposeCtrl', ->
  $scope = null
  $me = null
  controller = null
  promises = null
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
    module 'baobab'

    $me =
      namespacePromise: Promise.resolve
        draft: ->
          mockDraft1

    inject ($rootScope, $controller) ->
      $scope = $rootScope.$new()
      controller = $controller 'ComposeCtrl',
        $scope: $scope
        $me: $me

    promises =
      save: Promise.resolve(null)
      send: Promise.resolve(null)
      dispose: Promise.resolve(null)

    spyOn(mockDraft1, 'save').andReturn promises.save
    spyOn(mockDraft1, 'send').andReturn promises.send
    spyOn(mockDraft1, 'dispose').andReturn promises.dispose

    mockPromises.executeForPromise($me.namespacePromise)

  afterEach ->
    `Promise = mockPromises.getOriginalPromise();`

  it 'should create a draft on load', ->
    expect(controller.draft).toBeDefined()
    expect(controller.draft).toBe(mockDraft1)

  it 'should create a draft on discardClicked', ->
    controller.discardClicked()
    expect(mockDraft1.dispose).toHaveBeenCalled()

  it 'should save and send on sendClicked', ->
    controller.sendClicked()
    mockPromises.executeForPromise(promises.save)
    expect(mockDraft1.save).toHaveBeenCalled()
    expect(mockDraft1.send).toHaveBeenCalled()

  it 'should save on leaveClicked', ->
    controller.leaveClicked()
    mockPromises.executeForPromise(promises.save)
    expect(mockDraft1.save).toHaveBeenCalled()
    expect(controller.draft).toBeNull()
