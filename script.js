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

  function ajax(options) {
    var xhr = new XMLHttpRequest();

    xhr.open(options.method, options.url, true);

    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');

    if (options.headers) {
      for (var header in options.headers) {
        xhr.setRequestHeader(header, options.headers[header]);
      }
    }

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (options.success) {
          options.success(JSON.parse(xhr.response));
        }
      } else {
        if (options.error) {
          options.error('Error communicating with the server.');
        }
      }
    };

    xhr.onerror = options.error;

    xhr.send(JSON.stringify(options.data));
  }

  function handleError() {
    console.error.apply(console, arguments);
    alert('Error fetching or sending data.');
  }

  function requestFromApi(method, resource, success, error, params) {
    ajax({
      method: method,
      url: 'https://api.gitter.im/v1/' + resource,
      headers: {
        Authorization: 'Bearer ' + config.userAccessToken
      },
      data: params,
      success: success,
      error: error
    });
  }

  function getUser(success, error) {
    var userSuccess = function (users) {
      success(users[0]);
    };

    requestFromApi('GET', 'user', userSuccess, error);
  }

  function getMessages(success, error, afterId) {
    var resource = 'rooms/' + config.roomId + '/chatMessages';

    var params;
    if (afterId) {
      params = {
        afterId: afterId
      }
    }

    requestFromApi('GET', resource, success, error, params);
  }

  var lastMessageId;
  function rememberLastMessageId(messages) {
    var lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      lastMessageId = lastMessage.id;
    }
  }

  function sendMessage(text, success, error) {
    var resource = 'rooms/' + config.roomId + '/chatMessages';
    requestFromApi('POST', resource, success, error, {text: text});
  }

  var AppContainer = React.createClass({
    getInitialState: function () {
      return {
        messages: []
      }
    },

    componentDidMount: function () {
      var self = this;

      getUser(function (user) {
        userId = user.id;

        getMessages(function (messages) {
          rememberLastMessageId(messages);
          if (!config.hidePastMessages) {
            self.setState({
              messages: self.state.messages.concat(messages)
            });
          }

          setInterval(function () {
            getMessages(function (messages) {
              rememberLastMessageId(messages);
              self.setState({
                messages: self.state.messages.concat(messages)
              });
            }, handleError, lastMessageId);
          }, 3000);
        }, handleError);
      }, handleError);
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
      if (message) {
        sendMessage(message);
      }
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

  var MessageList = function (props) {
    return React.createElement('div', null,
      props.messages.map(function (message) {
        return React.createElement(Message, {key: message.id, message: message});
      })
    );
  };

  var Message = function (props) {
    var message = props.message;
    var date = new Date(message.sent).toLocaleTimeString();
    var authorClass = message.fromUser.id === userId ? 'own' : 'other';
    return React.createElement('div', {key: message.id, className: 'message ' + authorClass},
      React.createElement('date', null, date),
      React.createElement('div', null, message.text)
    );
  };

  ReactDOM.render(React.createElement(AppContainer), document.getElementById('app'));

})(app.config);
