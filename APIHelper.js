function request(method, url, headers, params) {
	return new Promise(function(resolve,reject) {
		if(url != null) {
			if(method == null) {
				method = 'GET'; // defaults to get
			} 

			var req = new XMLHttpRequest();
			req.open(method, url, true);

			if(params != null || params != undefined) {
				if(typeof params !== 'object') { // not formdata 
					console.log('not object');
					req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				} else {
					console.log('object');
					//req.setRequestHeader("Content-type", "multipart/form-data;");

					var formData = new FormData();

					for (var key in params) {
	    				formData.append(key, params[key]);
					}

					params = formData;
				}
			}

			if(headers != undefined) {
				for (var i = 0; i<headers.length; i++) {
					var header = headers[i];
					req.setRequestHeader(header.key, header.value);
				};
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
								reject(new Error('invalid JSON')); 
							}
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

// validate method
function validate(status) {
	if(status >= 200 && status <= 304 || status == 409) { // good
		return true;
	}
	return false; // bad
}