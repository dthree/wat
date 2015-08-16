Barebones IP firewall for limiting connections down to your internal subnets. For sensitive applications, does not replace authentication.

```js
vantage.firewall.policy(string); // 'ACCEPT' or 'REJECT'
vantage.firewall.accept(address[:port][, port])
vantage.firewall.reject(address[:port][, port])

vantage.firewall
  .policy("REJECT")
  .accept("10.0.0.0/8")
  .accept("192.168.0.0", 24);  
```