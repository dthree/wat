## .filter(callback[, this])

Returns the elements of an array that meet the condition specified in a callback function.

```js
const numbers = [31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53];

const primes = numbers.filter(function(value, index, numbersArray){
  high = Math.floor(Math.sqrt(value)) + 1;
  for (var div = 2; div <= high; div++) {
    if (value % div == 0) {
      return false;
    }
  }
  return true;
});

// [31, 37, 41, 43, 47, 53]
```