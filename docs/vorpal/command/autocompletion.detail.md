## vorpal.command.autocompletion(function)

Registers a custom tabbed autocompletion for this command.

If a user has typed part of a registered command, the default auto-completion will fill in the rest of the command:

```text
node~$ co
node~$ cook
```

However, after the user has fully typed the command `cook`, you can now implement command-specific auto-completion:

```text
node~$ bake coo            # tab is pressed
node~$ bake cookies        # tab is pressed again
cake  cookies  pie
node~$ bake cookies 
```
This is implemented as follows:

```js
vorpal
  .command('bake', 'Bakes a meal.')
  .autocompletion(function(text, iteration, cb) {

    // Available options
    const meals = ['cookies', 'pie', 'cake'];

    // The iteration is the count of how many times the `tab` 
    // key was pressed in a row. You can make multiple presses 
    // return all of the options for the user's convenience. 
    if (iteration > 1) {

      // By returning an array of values, Vorpal will format 
      // them in a pretty fashion, as in the example above.
      cb(void 0, meals);

    } else {

      // `this.match` is a helper function that will return 
      // the closest auto-completion match.
      var match = this.match(text, meals);

      if (match) {

        // If there is a good autocomplete, return it in the 
        // callback (first param is reserved for errors).
        cb(void 0, meals);
      } else {

        // If you don't want to do anything, just return undefined.
        cb(void 0, void 0);
      }
    }
  }).action(bake);
```
