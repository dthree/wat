## pageres

Capture screenshots of websites in various resolutions. A good way to make sure your websites are responsive. It's speedy and generates 100 screenshots from 10 different websites in just over a minute. It can also be used to render SVG images.

Visit pageres-cli for the command-line version.

```js
var Pageres = require('pageres');

var pageres = new Pageres({delay: 2})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .src('todomvc.com', ['1280x1024', '1920x1080'])
  .dest(__dirname);

pageres.run(function (err) {
  console.log('done');
});
```