## .map(callback[, this])

Calls a defined callback function on each element of an array, and returns an array that contains the results.

```js
const radii = [10, 20, 30];
const areas = radii.map(function(radius){
  const area = Math.PI * (radius * radius);
  return area.toFixed(0);
});
// [314, 1257, 2827]
```

```js
const products = [1, 2, 3].map(function(nbr){
  return nbr * 10;
});
// [10, 20, 30]
```
