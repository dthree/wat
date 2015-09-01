## Pageres({ delay: number })

Delay capturing the screenshot.

Useful when the site does things after load that you want to capture.

```js
var pageres = new Pageres({delay: 2})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```