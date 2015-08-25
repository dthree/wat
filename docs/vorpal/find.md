## vorpal.find(string)

Returns a given command by its name. This is used instead of `vorpal.command()` as `.command` will overwrite a given command. If command is not found, `undefined` is returned.

```js
  var help = vorpal.find('help');
  if (help) { 
    help.hidden() 
  }
```
