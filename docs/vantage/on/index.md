Vantage extends `EventEmitter.prototype`. Simply use `vantage.on('event', fn)` and `vantage.emit('event', data)`. The following events are supported:

- `command_registered`: Fires when `vantage.command` registers a new command.
- `client_keypress`: Fires on keypress on local client terminal.
- `client_prompt_submit`: Fires when the CLI prompt has been submitted with a command, including ''.
- `client_command_executed`: Fires at the client once the command has been received back as executed.
- `client_command_error`: Fires at the client if a command comes back with an error thrown.
- `client_connect`: Maps to `connect` for `socket.io-client`.
- `client_connect_error`: Maps to `connect_error` for `socket.io-client`.
- `client_error`: Maps to `error` for `socket.io-client`.
- `client_disconnect`: Maps to `disconnect` for `socket.io-client`.
- `server_connection`: Maps to `connection` for `socket.io`.
- `server_disconnect`: Maps to `disconnect` for `socket.io`.
- `server_command_received`: Fires at the end-server actually executing a command receives the command.