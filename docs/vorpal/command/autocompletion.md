## vorpal.command.autocompletion(function)

Registers a custom tabbed autocompletion for this command. 

```js
vorpal
  .command('bake', 'Bakes a meal.')
  .autocompletion(function(text, iteration, cb) {
    const meals = ['cookies', 'pie', 'cake'];
    if (iteration > 1) {
      cb(void 0, meals);
    } else {
      var match = this.match(text, meals);
      if (match) {
        cb(void 0, match);
      } else {
        cb(void 0, void 0);
      }
    }
  }).action(bake);
```