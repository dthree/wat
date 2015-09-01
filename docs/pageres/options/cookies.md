## Pageres({ cookies: string })

A string with the same format as a browser cookie or an object of what `phantomjs.addCookie` accepts.

```js
var pageres = new Pageres({cookies: cookie})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```

Tip: Go to the website you want a cookie for and copy-paste it from Dev Tools.