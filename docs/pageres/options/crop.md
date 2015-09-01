## Pageres({ crop: number })

Crop to the set height.

```js
var pageres = new Pageres({crop: 768})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```