# vantage.command().action(function(args, callback));

```js
vantage.command('foo', 'Outputs "bar".')
  .action(function(args, cb) {
    this.log(args);
  	cb();
	});
```