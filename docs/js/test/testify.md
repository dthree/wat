## JSON.stringify(value[, replacer[, space]])

```js
JSON.stringify({ x: 5 });																				 
// '{"x":5}'

JSON.stringify({ foo: 'bar', bar: 'foo'}, function(key, value){  
	return (key === 'bar') ? undefined : value;
});
// '{"foo":"bar"}'

JSON.stringify({x:5, y:7}, null, '\t');
// '{
//      "x": 5,
//      "y": 7
// }'
```  
        