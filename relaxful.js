// Created by Ian Foose Foose Industries 2018
/* make a request
* 
* params
* method String
* url String
* obj Optional overload params, such as headers and params 
*
* retruns a request object
*/
function request(method, url, obj) {
	var apiReq;

	var requestObj = {
		req:apiReq,
		promise: new Promise(function(resolve, reject) {
			if(url) {
				if(!method) {
					method = 'GET'; // defaults to get
				} 

				apiReq = new XMLHttpRequest();
				apiReq.open(method, url, true);

				var body;

				if(obj) {
					if(obj.body) {
						if(typeof obj.body !== 'object') { // not formdata 
							apiReq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
							body = obj.body;
						} else {
							body = obj.body; 
						}
					}

					if(obj.headers) {
						for (var key in obj.headers) {
							if (obj.headers.hasOwnProperty(key)) {
					        		apiReq.setRequestHeader(key, obj.headers[key]);
					      		}
					    	}
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

								var msg = apiReq.status+' Error';

								if(apiReq.responseText) {
									try {
										msg = JSON.parse(apiReq.responseText);
									} catch(error) { }
								}

								return reject({status: apiReq.status, message:msg});
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
				
				apiReq.send(body); 
			} else {
				reject(new Error('URL is empty, URL must not be empty'));
			}
		})
	}

	return requestObj;
}
