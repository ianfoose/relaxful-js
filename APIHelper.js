// request object
var apiReq;

/*
* Cancel a request
*
* return void
*/
function cancelRequest() {
	if(apiReq) { apiReq.abort(); }
}

/* make a request
* 
* params
* method String
* url String
* obj Optional overload params, such as headers and params 
*
* retruns a promise
*/
function request(method, url, obj) {
	return new Promise(function(resolve,reject) {
		if(url) {
			if(!method) {
				method = 'GET'; // defaults to get
			} 

			apiReq = new XMLHttpRequest();
			apiReq.open(method, url, true);

			var params;

			if(obj) {
				if(obj.params) {
					if(typeof obj.params !== 'object') { // not formdata 
						apiReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
						params = obj.params;
					} else {
						var formData = new FormData();

						for (var key in obj.params) {
		    				formData.append(key, obj.params[key]);
						}

						params = formData;
					}
				}

				if(obj.headers) {
					for (var i = 0; i<obj.headers.length; i++) {
						var header = obj.headers[i];
						apiReq.setRequestHeader(header.key, header.value);
					};
				} 
			}

			apiReq.onload = function(e) {
				var resp = {
					status:apiReq.status,
					message:apiReq.statusText,
					headers:apiReq.getAllResponseHeaders(),
					text:apiReq.responseText,
					json() {
						return new Promise(function(resolve,reject) {
							try {
								result = JSON.parse(apiReq.responseText);
								resolve(result);
							} catch(error) {
								reject(new Error('Invalid JSON')); 
							}
						});
					},
					validate() {
						return new Promise(function(resolve,reject) {
							if(apiReq.status >= 200 && apiReq.status <= 304 || apiReq.status == 409) {
								resolve(resp);
							}
							return reject(new Error(apiReq.status+' Error'));
						});
					}
				}

				resolve(resp);
			}

			apiReq.onerror = function() {
				reject(new Error('Network Error'));
			}

			apiReq.onabort = function() {
				apiReq = null;
			}
			
			apiReq.send(params); 
		} else {
			reject(new Error('URL is empty, URL must not be empty'));
		}
	});
}