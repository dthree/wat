## array.splice(start, deleteCount[, items...])

Changes the content of an array by removing existing elements and/or adding new elements.

```js
let fish = ['angel', 'clown', 'mandarin', 'surgeon'];

var removed = fish.splice(2, 0, 'drum');
// fish    -> ['angel', 'clown', 'drum', 'mandarin', 'surgeon']
// removed -> []

removed = fish.splice(3, 1);
// fish    -> ['angel', 'clown', 'drum', 'surgeon']
// removed -> ['mandarin']

removed = fish.splice(2, 1, 'trumpet');
// fish    -> ['angel', 'clown', 'trumpet', 'surgeon']
// removed -> ['drum']

removed = fish.splice(0, 2, 'parrot', 'anemone', 'blue');
// fish    -> ['parrot', 'anemone', 'blue', 'trumpet', 'surgeon']
// removed -> ['angel', 'clown']

removed = fish.splice(3, Number.MAX_VALUE);
// fish    -> ['parrot', 'anemone', 'blue']
// removed -> ['trumpet', 'surgeon']
```              