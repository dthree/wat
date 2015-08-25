# vorpal.command().option(option, [description]);

```js
vorpal.command('foo', 'Outputs "bar".')
  .option('-d, --double', 'Outputs "bar" twice.')
  .option('-f', 'Outputs "foo" instead.')
  .option('--time', 'Outputs the current time.')
  .option('-e, --echo <something>', 'Outputs given param.')
  .option('-w, --wait [millis]', 'Waits before executing. Defaults to 10 millis.')
  .action(function(args, cb) {
    this.log(args);
  	cb();
	});
```

Option Usage:
```bash
~$ foo -dfw --time -e hello
{ options: {
    double: true,
    f: true,
    time: true,
    echo: 'hello',
    wait: true
	}
}
```

