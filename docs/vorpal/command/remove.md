# vorpal.command().remove();

Deletes a given command. Useful for getting rid of unwanted functionality when importing external extensions.

```js
  var help = vorpal.find('help');
  if (help) { 
    help.remove() 
  }
```
