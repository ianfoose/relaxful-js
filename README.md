# API Helper JS

## Use

### JSON

```js
request('GET','url').then(response=>{
	return response.validate();
}).then(response=>{
	return response.json();
}).then(json => {
	// handle json 
}).catch(error => {
	alert(error.message);
});
```
