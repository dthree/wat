## Pageres([options])

Capture screenshots of websites in various resolutions. A good way to make sure your websites are responsive. It's speedy and generates 100 screenshots from 10 different websites in just over a minute. It can also be used to render SVG images.

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
#### options

##### delay

Type: `number` *(seconds)*  
Default: `0`

Delay capturing the screenshot.

Useful when the site does things after load that you want to capture.

##### crop

Type: `boolean`  
Default: `false`

Crop to the set height.

##### cookies

Type: `array` of `string`, `object`

A string with the same format as a [browser cookie](http://en.wikipedia.org/wiki/HTTP_cookie) or an object of what [`phantomjs.addCookie`](http://phantomjs.org/api/phantom/method/add-cookie.html) accepts.

###### Tip

Go to the website you want a cookie for and copy-paste it from Dev Tools.

##### filename

Type: `string`

Define a customized filename using [Lo-Dash templates](http://lodash.com/docs#template).  
For example `<%= date %> - <%= url %>-<%= size %><%= crop %>`.

Available variables:

- `url`: The URL in [slugified](https://github.com/ogt/slugify-url) form, eg. `http://yeoman.io/blog/` becomes `yeoman.io!blog`
- `size`: Specified size, eg. `1024x1000`
- `width`: Width of the specified size, eg. `1024`
- `height`: Height of the specified size, eg. `1000`
- `crop`: Outputs `-cropped` when the crop option is true
- `date`: The current date (Y-M-d), eg. 2015-05-18
- `time`: The current time (h-m-s), eg. 21-15-11

##### selector

Type: `string`

Capture a specific DOM element.

##### hide

Type: `array`

Hide an array of DOM elements.

##### username

Type: `string`

Username for authenticating with HTTP auth.

##### password

Type: `string`

Password for authenticating with HTTP auth.

##### scale

Type: `number`  
Default: `1`

Scale webpage `n` times.

##### format

Type: `string`  
Default: `png`  
Values: `png`, `jpg`

Image format.

##### userAgent

Type: `string`

Custom user agent.

##### headers

Type: `object`

Custom HTTP request headers.