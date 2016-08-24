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

  var AppContainer = React.createClass({
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
      return React.createElement(App, {
        config: config,
        messages: this.state.messages
      });
    }
  });

  var App = React.createClass({
    handleSendButtonClick: function (event) {
      var messageBox = this.refs.messageBox;
      var message = messageBox.value;
      sendMessage(message);
      messageBox.value = '';
      messageBox.focus();
    },

    render: function () {
      return React.createElement('div', {className: 'app-content'},
        config.title ? React.createElement('h1', null, config.title) : null,
        config.description ? React.createElement('p', null, config.description) : null,
        React.createElement(MessageList, {messages: this.props.messages}),
        React.createElement('textarea', {ref: 'messageBox', className: 'messagebox'}),
        React.createElement('button', {onClick: this.handleSendButtonClick}, 'send')
      );
    }
  });

  var MessageList = React.createClass({
    render: function () {
      return React.createElement('div', null,
        this.props.messages.map(function (message) {
          var date = new Date(message.sent).toLocaleTimeString();
          var authorClass = message.fromUser.id === userId ? 'own' : 'other';
          return React.createElement('div', {key: message.id, className: 'message ' + authorClass},
            React.createElement('date', null, date),
            React.createElement('div', null, message.text)
          )
        }.bind(this))
      );
    }
  });

  ReactDOM.render(React.createElement(AppContainer), document.getElementById('app'));

})(app.config);
