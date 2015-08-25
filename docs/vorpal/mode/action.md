## .mode.action(function)

Similar to `command.action`, `mode.action` differs in that it is repeatedly called on each command the user types until the mode is exited. Instead of `args` passed as the first argument, the full `command` string the user typed is passed and it is expected that `mode.action` appropriately handles the command. Example given above.

```js
vorpal
  .mode('sql')
  .delimiter('sql:')
  .init(function(args, callback){
    this.log('Welcome to SQL mode.\nYou can now directly enter arbitrary SQL commands. To exit, type `exit`.');
    callback();
  })
  .action(function(command, callback) {
    var self = this;
    app.query(command, function(res){
      self.log(res);
      callback();
    });
  });
```
