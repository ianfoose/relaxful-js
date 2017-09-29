# Relaxful

A Javascript REST API client.

## Use

Include file

```html
<script type="text/javascript" src="relaxful.js"></script>
```

The ```request()``` function retruns a promise object and the XMLHttpRequest object

### JSON

```js
request('GET','url').promise.then(response=>{
	return response.validate();
}).then(response=>{
	return response.json();
}).then(json => {
	// handle json 
}).catch(error => {
	alert(error.message);
});
```

### Text

```js
request('GET','url').promise.then(response=>{
	alert(response.text);
}).catch(error => {
	alert(error.message);
});
```

### Validate

```js
request('GET','url').promise.then(response=>{
	return response.validate();
}).then(response=>{
	// do something with valid response
}).catch(error => {
	alert(error.message);
});
```

### Params and Headers

```js
var params = { "id":1 };
var headers = { "Content-Type": "text/html" };

request('GET','url',{
'params':params,
'headers':headers
}).then(response=>{
	return response.validate();
}).then(response=>{
	// do something with valid response
}).catch(error => {
	alert(error.message);
});
```

### Cancel a Request

Cancels the current request.

```js
requestObj.req.cancelRequest();
```


