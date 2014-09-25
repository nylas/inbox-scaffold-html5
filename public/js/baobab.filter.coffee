
define ["angular", "underscore", "moment"], (angular, _, moment) ->
  angular.module("baobab.filter", [])

  .filter('shorten', () ->
    (input) ->
      if typeof input == 'string' && input.length > 64
        input.substring(0, 60) + ' ...'
      else
        input
  )

  .filter('tag_expand', () ->
    (input) ->
      tags = ""
      tags += item.name + " " for item in input
      tags
  )

  .filter('pretty_size', () ->
    (filesize) ->
      if (filesize < 1000)
        return "#{filesize} B"
      if (filesize < 1000000)
        return "#{Math.floor(filesize/1000)} KB"
      else
        return "#{Math.floor(filesize/1000000)} MB"
  )

  .filter('participants', ['$namespaces', ($namespaces) ->
    (participants, preset) ->
      meEmail = $namespaces.current().emailAddress
      meParts = meEmail.split('@')
      str = ''

      preset = preset || 'short'

      participants.forEach (participant) ->
        # If we are the participant, show "Me" instead of our name
        name = participant.name
        name = 'Me' if (participant.email == meEmail)

        if participants.length == 2 && name == 'Me'
          return

        # If no name is provided, use the email address
        if _.isEmpty(name)
          name = participant.email
          parts = name.split('@')

          if preset == 'short'
            # If the name contains the user's domain name, strip it out
            # team@inboxapp.com => team
            if (parts[1] == meParts[1])
              name = parts[0]

            # If the participant is an automated responder, show the email domain
            else if (_.contains(['support', 'no-reply', 'info'], parts[0]))
              name = parts[1]


        if preset == 'short'
          # If the name contains parenthesis "Inbox Support (Ben Gotow)", trim it
          # to the contents of the parenthesis
          if name.indexOf('(') > 0
            start = name.indexOf('(') + 1
            end = name.indexOf(')')
            name = name.substr(start, end-start)

        # Append the name to the output string
        str += ', ' if str.length
        str += name

      return str
  ])

  .filter('timestamp_ago', () ->
    (date) ->
      moment(date).fromNow()
  )

  .filter('timestamp_short', () ->
    (_date) ->
      date = moment(_date)
      dateYear = date.format('YYYY')/1
      nowYear = moment().format('YYYY')/1
      dateDay = date.format('DDD')/1 + 365 * dateYear
      nowDay = moment().format('DDD')/1 + 365 * nowYear

      if (dateDay == nowDay)
        return date.format('h:mma')
      else if (nowDay - dateDay < 7)
        return date.format('dddd, h:mma')
      else if (nowYear == dateYear)
        return date.format('MMM Do')
      else
        return date.format('M/D/YYYY')
  )

  .filter('extension', () ->
    (filename) ->
      parts = filename.split('.')
      if (parts.length > 1)
        return parts[parts.length-1]
      else
        return ""
  )

  .filter('type_to_glyph', () ->
    (type) ->
      if (type == "application/pdf")
        return "book"
      else if (type.match(/image/))
        return "picture"
      else if (type.match(/audio/))
        return "music"
      else if (type.match(/video/))
        return "video"
      else if (type.match(/text/))
        return "list-alt"
      else if (type == "application/gzip")
        return "compressed"
      else
        return "file"
  )

  .filter('attachment_type_to_glyph', () ->
    (input) ->
      type = input.contentType
      return "file" if typeof type == "undefined"

      if (type == "application/pdf")
        return "book"
      else if (type.match(/image/))
        return "picture"
      else if (type.match(/audio/))
        return "music"
      else if (type.match(/video/))
        return "video"
      else if (type.match(/text/))
        return "list-alt"
      else if (type == "application/gzip")
        return "compressed"
      else
        return "file"
  )

