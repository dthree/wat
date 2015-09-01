## .src(url, sizes[, options])

Add a page to a screenshot.

```js
var pageres = new Pageres({delay: 2})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .src('todomvc.com', ['1280x1024', '1920x1080'])
  .dest(__dirname);
```
#### url

*Required*  
Type: `string`

URL or local path to the website you want to screenshot.

#### sizes

*Required*  
Type: `array`

Use a `<width>x<height>` notation or a keyword.

A keyword is a version of a device from [this list](http://viewportsizes.com).
You can also pass in the `w3counter` keyword to use the ten most popular
resolutions from [w3counter](http://www.w3counter.com/globalstats.php).

#### options

Type: `object`

Options set here will take precedence over the ones set in the constructor.