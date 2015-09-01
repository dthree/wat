## Pageres({ hide: array })

Hide an array of DOM elements.

```js
var pageres = new Pageres({hide: ['.unicorn-badge', '.button']})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```