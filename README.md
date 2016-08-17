# Anonymous Gitter Chat

This simple client-side web app let's you chat in a predefined Gitter room as a predefined user. Make yourself heard without an account.

## Config

Add a file `config.js` that sets the Gitter API user access token and the room ID like that:

```javascript
app.config.userAccessToken = 'REPLACE_WITH_TOKEN';
app.config.roomId = 'REPLACE_WITH_ROOM_ID';
```

The token can be found here: https://developer.gitter.im/apps.

The room ID is part of the response of the REST API endpoint `https://api.gitter.im/v1/rooms`.

E.g. using cURL: `curl -H "Authorization: Bearer {token}" https://api.gitter.im/v1/rooms`

### Options

#### Hide Past Messages

```javascript
app.config.hidePastMessages = true|false;
```

**Default** `false`

If `true`, only display messages that were sent since starting the app. By default, a messages history will be shown initially.

#### Title

```javascript
app.config.title = "Title";
```

**Default** `""`

Title of the app, displayed as a heading at the top.

#### Description

```javascript
app.config.description = "Description";
```

**Default** `""`

Description of the app, displayed as a paragraph below the title.

## Deploy

Just serve the files in this directory with any web server.
