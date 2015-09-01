## .run(callback)

Run pageres.

```js
// If you don't set a `.dest()` you'll get `items` in this callback, 
// which is an array of streams.
pageres.run(function (err, items) {
  console.log('done');
});
```
