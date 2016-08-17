(function (config) {
  'use strict';

  if (!config.userAccessToken) {
    console.error('No user access token configured');
    return;
  }

  if (!config.roomId) {
    console.error('No room ID configured');
    return;
  }

  var userId;

  function requestFromApi(method, resource, params) {
    return $.ajax({
      method: method,
      url: 'https://api.gitter.im/v1/' + resource,
      headers: {
        Authorization: 'Bearer ' + config.userAccessToken
      },
      data: params
    });
  }

  function getUser() {
    return requestFromApi('GET', 'user')
    .then(function (users) {
      return users[0];
    });
  }

  function getMessages(afterId) {
    var resource = 'rooms/' + config.roomId + '/chatMessages';

    var params;
    if (afterId) {
      params = {
        afterId: afterId
      }
    }

    return requestFromApi('GET', resource, params);
  }

  var lastMessageId;
  function rememberLastMessageId(messages) {
    var lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      lastMessageId = lastMessage.id;
    }
  }

  function handleNewMessages(messages) {
    rememberLastMessageId(messages);

    messages.forEach(function (message) {
      var date = new Date(message.sent).toLocaleTimeString();
      var authorClass = message.fromUser.id === userId ? 'own' : 'other';
      var html = '<div class="message ' + authorClass + '"><date>' + date + '</date><div>' + message.text + '</div></div>';
      $('#messagedisplay').append(html);
    });
  }

  var interval;
  function startInterval() {
    interval = setInterval(function () {
      getMessages(lastMessageId)
      .then(handleNewMessages)
      .catch(console.error.bind(console));
    }, 3000);
  }

  function stopInterval() {
    clearInterval(interval);
  }

  function sendMessage(text) {
    var resource = 'rooms/' + config.roomId + '/chatMessages';
    return requestFromApi('POST', resource, {text: text});
  }

  getUser()
  .then(function (user) {
    userId = user.id;
  })
  .then(getMessages)
  .then(function (messages) {
    if (config.hidePastMessages) {
      rememberLastMessageId(messages);
    } else {
      handleNewMessages(messages);
    }
  })
  .then(startInterval)
  .catch(console.error.bind(console));

  $('#sendbutton').click(function () {
    var message = $('#messagebox').val();
    sendMessage(message);
    $('#messagebox')
    .val('')
    .focus();
  });

  if (config.description) {
    $('#content').prepend('<p>' + config.description + '</p>');
  }

  if (config.title) {
    $('#content').prepend('<h1>' + config.title + '</h1>');
  }

})(app.config);
