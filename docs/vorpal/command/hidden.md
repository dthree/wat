## vorpal.command().hidden();

Removes a command from the help menu.

```js
vorpal
  .command('secret', 'Does shady, secret things.')
  .hidden()
  .action(function(args, cb) {
  	cb();
	});   
```
