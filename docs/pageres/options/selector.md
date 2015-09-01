## Pageres({ selector: string })

Capture a specific DOM element.

```js
var pageres = new Pageres({selector: '.unicorn-badge'})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```