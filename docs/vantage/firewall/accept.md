## vantage.firewall.accept(address[:port][, port])

Permits a Vantage client from a given IP subnet to connect to the local Vantage server.

```js
vantage.firewall.accept('192.168.0.0', '24'); 
vantage.firewall.accept('192.168.0.0/24'); 

vantage.firewall
  .policy("REJECT")
  .accept("10.0.0.0/8")
  .accept("192.168.0.0", 24);  
```
