define [], () ->
  _displayErrors = true
  window.onbeforeunload = () ->
    _displayErrors = false
    return

  @_handleAPIError = (error) ->
    if (!_displayErrors)
      return
    msg = "An unexpected error occurred. (HTTP code " + error['status'] + "). Please try again."
    if error['message']
      msg = error['message']
    alert(msg)
