## Pageres({ filename: string })

Define a customized filename using Lo-Dash templates.

For example `<%= date %> - <%= url %>-<%= size %><%= crop %>`.

Available variables:

- `url`: The URL in slugified form, eg. `http://yeoman.io/blog/` becomes `yeoman.io!blog`
- `size`: Specified size, eg. `1024x1000`
- `width`: Width of the specified size, eg. `1024`
- `height`: Height of the specified size, eg. `1000`
- `crop`: Outputs `-cropped` when the crop option is true
- `date`: The current date (Y-M-d), eg. 2015-05-18
- `time`: The current time (h-m-s), eg. 21-15-11

```js
var pageres = new Pageres({filename: '<%= date %>'})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```