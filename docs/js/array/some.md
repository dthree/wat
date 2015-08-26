## .some(callback[, this])

Determines whether the specified callback function returns `true` for any element of an array.

```js
// The callback function.
const numbers = [1, 15, 4, 10, 11, 22];

const someEvens = numbers.some(function(value, index, ar) {
  return (value % 2 === 0);
}
// true
```
