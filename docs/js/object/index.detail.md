## Object([value])

The `Object` constructor creates an object wrapper for the given value. If the value is `null` or `undefined`, it will create and return an empty object, otherwise, it will return an object of a Type that corresponds to the given value. If the value is an object already, it will return the value.

When called in a non-constructor context, `Object` behaves identically to `new Object()`.

```js
var obj = { foo: 'bar', foos: 4 }

var obj = new Object();
```
