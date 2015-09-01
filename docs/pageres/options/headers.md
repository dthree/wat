## Pageres({ headers: string })

Custom HTTP request headers.

```js
var pageres = new Pageres({headers: headers})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```