## this.log(string)

Operates like console.log, however keeps all stdout within a Vantage session, handles all piping of stdout to other instances of Vantage, etc. In short, use it.

```js
vorpal.command('foo', 'Outputs "bar".')
  .action(function(args, cb) {
    this.log("bar"); 
    cb();
  });
```