## vorpal.command().alias(string);

```js
vorpal.command('foo', 'Outputs "foobar".')
  .alias('foobar')
  .alias('foosball')
  .action(function(args, cb) {
    this.log('foobar');
  	cb();
	});
```
