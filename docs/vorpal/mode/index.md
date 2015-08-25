Mode is a special variation of `command` that brings the user into a given `mode`, wherein regular Vorpal commands are ignored and the full command strings are interpreted literally by the `mode.action` function. This will continue until the user exits the mode by typing `exit`.

```js
vorpal
  .mode("repl")
  .description("Enters the user into a REPL session.")
  .delimiter("repl:")
  .action(function(command, callback) {
    this.log(eval(command));
  });
```
