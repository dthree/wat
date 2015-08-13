## robot.moveMouseSmooth(x, y)

Moves mouse to x, y - human like.

```js
robot.moveMouseSmooth(200, 300);

let mouse = robot.getMousePos();
robot.moveMouseSmooth(mouse.x, mouse.y + 100);
```
