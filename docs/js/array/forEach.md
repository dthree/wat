## .forEach(callback[, this])

Performs the specified action for each element in an array.

```js
const letters = ['ab', 'cd', 'ef'];

letters.forEach(function(value, index, lettersArray){
  console.log(value, ", " + index);  
});

// ab, 0
// cd, 1
// ef, 2
```