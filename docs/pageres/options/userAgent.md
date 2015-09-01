## Pageres({ userAgent: string })

Custom user agent.

Default: `png`  
Values: `png`, `jpg`

```js
var pageres = new Pageres({userAgent: agent})
  .src('yeoman.io', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
  .dest(__dirname);
```