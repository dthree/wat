## .assign(target, sources...)

Used to copy the values of all enumerable own properties from one or more source objects to a target object. It will return the target object.

```js
// Cloning an object
const obj = {a: 1};
const copy = Object.assign({}, obj);
console.log(copy); // {a: 1}
```
```js
// Merging objects
const o1 = { a: 1 };
const o2 = { b: 2 };
const o3 = { c: 3 };

const obj = Object.assign(o1, o2, o3);
console.log(obj); // { a: 1, b: 2, c: 3 }
console.log(o1);  // { a: 1, b: 2, c: 3 }, target object itself is changed.
```