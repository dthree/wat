In a Vantage command's `action` function, `this` exposes a Session object, which comes with its own set of methods and properties.

```js
vantage.command('foo', 'Outputs "bar".')
  .action(function(args, cb) {
    this.log("bar"); 
  	cb();
	});
```