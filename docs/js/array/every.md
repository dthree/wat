## .every(callback[, this])

Determines whether all the members of an array satisfy the specified test.

```js
const numbers = [2, 4, 5, 6, 8];

const allEven = numbers.every(function(value, index, numbersArray) {
  return (value % 2 === 0);
});
```