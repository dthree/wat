## Pageres({ scale: number })

Scale webpage `n` times.

```js
var pageres = new Pageres({scale: 2})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```