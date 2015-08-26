## .findIndex(callback[, this])

Returns an index value for the first array element that meets test criteria specified in a callback function.

```js
const idx = [1, 2, 3].findIndex(function(x) { x == 2; }); // 1
const idx = [1, 2, 3].findIndex(function(x) { x == 4; }); // -1
```
