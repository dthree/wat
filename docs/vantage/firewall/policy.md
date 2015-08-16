## vantage.firewall.policy(string)

Sets the fallback policy if the Vantage client connecting to the server does not match any firewall rules. Defaults to 'ACCEPT'.

```js
// rejects all connections not matched on a rule.
vantage.firewall.policy('REJECT'); 

// accepts all connections not matched on a rule.
vantage.firewall.policy('ACCEPT'); 
```
