## this.prompt(object[, callback])

Vorpal supports mid-command prompting. You can make full use of `inquirer.js`'s prompt function, which is exposed through `this.prompt`.

```js
vorpal.command("destroy database").action(function(args, cb){
  var self = this;
  this.prompt({
    type: "confirm",
    name: "continue",
    default: false,
    message: "That sounds like a really bad idea. Continue?",
  }, function(result){
    if (!result.continue) {
      self.log("Good move.");
      cb();
    } else {
      self.log("Time to dust off that resume.");
      app.destroyDatabase(cb);
    }
  });
});
```