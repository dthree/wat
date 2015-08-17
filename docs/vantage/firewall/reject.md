## vantage.firewall.reject(address[:port][, port])

Denies a Vantage client from a given IP subnet access to the local Vantage server.

```js
vantage.firewall.reject('192.168.0.0', '24'); 
vantage.firewall.reject('192.168.0.0/24'); 

vantage.firewall
  .policy("ACCEPT")
  .reject("10.0.0.0/8")
  .reject("192.168.0.0", 24);  
```
