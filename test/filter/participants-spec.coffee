define ['angular', 'angularMocks', 'baobab.filter'], (angular) ->
  describe 'participants filter', ->
    participants = null

    mockParticipant1 =
      name: "Slartibartfast"
      email: "me@example.com"

    mockParticipant2 =
      name: "Ford Prefect"
      email: "ford@example.com"

    mockParticipant3 =
      email: "zaphod@example.com"

    mockParticipant4 =
      email: "arthur@earth.com"

    mockParticipant5 =
      email: "marvin@example.com"
      name: "Marvin (The Paranoid Android)"

    mockParticipant6 =
      name: ""
      email: "arthur@earth.com"

    beforeEach ->
      angular.module("baobab.test", ["baobab.filter"])
        .service "$me", () ->
          @emailAddress = () ->
            "me@example.com"
          return
      angular.mock.module("baobab.test")
      angular.mock.inject ($filter) ->
        participants = $filter("participants")

    it 'should show user\'s own name as \'Me\'', ->
      expect(participants [ mockParticipant1 ]).toEqual("Me")

    it 'should show only the other user in 2-person email', ->
      expect(participants [ mockParticipant1, mockParticipant2 ]).toEqual(mockParticipant2.name)
      expect(participants [ mockParticipant2, mockParticipant1 ]).toEqual(mockParticipant2.name)
      expect(participants [ mockParticipant2, mockParticipant2 ]).toEqual(
        mockParticipant2.name + ', ' + mockParticipant2.name
      )

    it 'should fall back to the email address if there is no name', ->
      expect(participants [ mockParticipant4 ]).toEqual mockParticipant4.email
      expect(participants [ mockParticipant6 ]).toEqual mockParticipant6.email

    it 'should fall back to email and truncate if in the same domain as user', ->
      expect(participants [ mockParticipant3 ]).toEqual (mockParticipant3.email.split("@")[0])

    it 'should show the domain for auto-responders', ->
      expect(participants [ { email: 'support@fake.com' }]).toEqual "fake.com"
      expect(participants [ { email: 'no-reply@fake.com'}]).toEqual "fake.com"
      expect(participants [ { email: 'info@fake.com' }]).toEqual "fake.com"

    it 'should trim parens', ->
      expect(participants [ mockParticipant5 ]).toEqual "The Paranoid Android"

    it 'should allow the "short" preset to be disabled', ->
      expect(participants [ mockParticipant5 ], "no").toEqual mockParticipant5.name
      expect(participants [ mockParticipant3 ], "no").toEqual mockParticipant3.email
