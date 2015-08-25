Vorpal extends `EventEmitter.prototype`. Simply use `vorpal.on('event', fn)` and `vorpal.emit('event', data)`. The following events are supported:

- `command_registered`: Fires when `vorpal.command` registers a new command.
- `client_keypress`: Fires on keypress on local client terminal.
- `client_prompt_submit`: Fires when the CLI prompt has been submitted with a command, including ''.
- `client_command_executed`: Fires at the client once the command has been received back as executed.
- `client_command_error`: Fires at the client if a command comes back with an error thrown.
