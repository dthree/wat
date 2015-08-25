## .mode.delimiter(string)

This will add on an additional delimiter string to one's Vorpal prompt upon entering the mode, so the user can differentiate what state he is in.

```js
vorpal
  .mode('repl')
  .delimiter('you are in repl>')
  .action(function(command, callback) {
    this.log(eval(command));
  });
```
```text
node~$ 
node~$ repl
node~$ you are in repl>  
```