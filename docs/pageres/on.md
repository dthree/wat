## .on('warn', callback)

Warning, for example with page errors.

```js
// If you don't set a `.dest()` you'll get `items` in this callback, 
// which is an array of streams.
pageres.on('warn', function (data) {
  console.log(data);
});
```
