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

  function sendMessage(text) {
    var resource = 'rooms/' + config.roomId + '/chatMessages';
    return requestFromApi('POST', resource, {text: text});
  }

  var MessageList = React.createClass({
    getInitialState: function () {
      return {
        messages: []
      }
    },

    componentDidMount: function () {
      getUser()
      .then(function (user) {
        userId = user.id;
      })
      .then(getMessages)
      .then(function (messages) {
        rememberLastMessageId(messages);
        if (!config.hidePastMessages) {
          this.setState({
            messages: this.state.messages.concat(messages)
          });
        }
      }.bind(this))
      .then(function () {
        setInterval(function () {
          getMessages(lastMessageId)
          .then(function (messages) {
            rememberLastMessageId(messages);
            this.setState({
              messages: this.state.messages.concat(messages)
            });
          }.bind(this))
          .catch(console.error.bind(console));
        }.bind(this), 3000);
      }.bind(this))
      .catch(console.error.bind(console));
    },

    render: function () {
      return React.createElement('div', null,
        this.state.messages.map(function (message) {
          var date = new Date(message.sent).toLocaleTimeString();
          var authorClass = message.fromUser.id === userId ? 'own' : 'other';
          return React.createElement('div', {className: 'message ' + authorClass},
            React.createElement('date', null, date),
            React.createElement('div', null, message.text)
          )
        }.bind(this))
      );
    }
  });

  ReactDOM.render(React.createElement(MessageList, { name: "John" }), document.getElementById('messagedisplay'));

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
