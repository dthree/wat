# vantage.command().alias(string);

```js
vantage.command('foo', 'Outputs "foobar".')
  .alias('foobar')
  .alias('foosball')
  .action(function(args, cb) {
    this.log('foobar');
  	cb();
	});
```
