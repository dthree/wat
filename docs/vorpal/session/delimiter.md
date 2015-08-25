## this.delimiter(string)

You can change the prompt delimiter mid command through `this.delimiter`.

```js
vorpal
  .command('delimiter <string>')
  .action(function(args, cb){
    this.delimiter(args.string);
    cb();
  });
```
```text
websvr~$ delimiter unicornsvr~$
unicornsvr~$
```