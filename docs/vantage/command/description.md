```js
vantage.command.description(string);

// As the second argument to `.command`:
vantage.command('foo', 'Outputs "bar".');

// As its own command.
vantage
	.command('foo')
	.description('Outputs "bar"');
```