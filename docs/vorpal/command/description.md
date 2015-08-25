## vorpal.command.description(string);

```js
// As the second argument to `.command`:
vorpal.command('foo', 'Outputs "bar".');

// As its own command.
vorpal
	.command('foo')
	.description('Outputs "bar"');
```