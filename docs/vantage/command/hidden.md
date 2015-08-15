# vantage.command().hidden();

Removes a command from the help menu.

```js
vantage
  .command('secret', 'Does shady, secret things.')
  .hidden()
  .action(function(args, cb) {
  	cb();
	});   
```
