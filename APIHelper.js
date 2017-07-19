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
		if(url != null) {
			if(method == null) {
				method = 'GET'; // defaults to get
			} 

			var req = new XMLHttpRequest();
			req.open(method, url, true);

			var params;

			if(obj) {
				if(obj.params) {
					if(typeof obj.params !== 'object') { // not formdata 
						console.log('not object');
						req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
					} else {
						console.log('object');
						//req.setRequestHeader("Content-type", "multipart/form-data;");

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
						req.setRequestHeader(header.key, header.value);
					};
				} 
			}

			req.onload = function(e) {
				var resp = {
					status:req.status,
					message:req.statusText,
					headers:req.getAllResponseHeaders(),
					text:req.responseText,
					json() {
						return new Promise(function(resolve,reject) {
							try {
								result = JSON.parse(req.responseText);
								resolve(result);
							} catch(error) {
								reject(new Error('Invalid JSON')); 
							}
						});
					},
					validate() {
						return new Promise(function(resolve,reject) {
							if(req.status >= 200 && req.status <= 304 || req.status == 409) {
								resolve(resp);
							}
							return reject(new Error(req.status+' Error'));
						});
						
					}
				}

				resolve(resp);
			}

			req.onerror = function() {
				reject(new Error('Network Error'));
			}
			
			req.send(params); 
		} else {
			reject(new Error('URL is empty, URL must not be empty'));
		}
	});
}