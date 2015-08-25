## vorpal.command().action(function(args, callback));

```js
vorpal.command('foo', 'Outputs "bar".')
  .action(function(args, cb) {
    this.log(args);
  	cb();
	});
```