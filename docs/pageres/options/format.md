## Pageres({ format: string })

Image format.

Default: `png`  
Values: `png`, `jpg`

```js
var pageres = new Pageres({format: 'jpg'})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```