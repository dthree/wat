## .auth(middleware[, options])

Uses a given authentication strategy. Pass the required middleware into the first variable, and any options / configuration for that middleware as given in that module's documentation into the options parameter.

```js
var pam = require("vantage-auth-pam");
vantage.auth(pam, options);
```
