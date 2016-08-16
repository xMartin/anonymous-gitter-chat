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

    if (messages.length) {
      console.log('lastMessageId', lastMessageId);
      console.log(messages);

      messages.forEach(function (message) {
        var date = new Date(message.sent).toLocaleTimeString();
        var html = '<div class="message"><div>' + date + '</div><div>' + message.text + '</div></div>';
        $('#messagedisplay').append(html);
      });
    } else {
      console.log('no new messages');
    }
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

  getMessages()
  .then(handleNewMessages)
  .then(startInterval)
  .catch(console.error.bind(console));

  $('#sendbutton').click(function () {
    var message = $('#messagebox').val();
    sendMessage(message);
    $('#messagebox')
    .val('')
    .focus();
  });

})(app.config);
