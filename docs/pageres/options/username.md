## Pageres({ username: string })

Username for authenticating with HTTP auth.

```js
var pageres = new Pageres({username: 'joe'})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```