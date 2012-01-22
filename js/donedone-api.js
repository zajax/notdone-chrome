var DoneDoneAPI = function(subdomain, username, password, api_token){

	var self = this;

	this.subdomain = trim(subdomain);
	this.username = trim(username);
    this.password = trim(password);
	this.token = trim(api_token);
	this.xmlReq = new XMLHttpRequest();

    this.baseURL = "https://"+this.subdomain+".mydonedone.com/IssueTracker/API/";

    //this.projects = [];
    //this.priorities = [];
};


DoneDoneAPI.prototype = {

	projects: function(data, callback){
		return this.request('Projects', "GET", this.projects_process, callback);
	},
	projects_process:function(data){
		console.log(data);
		return data;
	},
	priorities: function(data, callback){
        return this.request('PriorityLevels', "GET", this.priorities_process, callback);
    },
    priorities_process:function(data){
      console.log(data);
      return data;  
    },
    people:function(data, callback){
      return this.request('PeopleInProject/'+data.projectID, "GET", this.people_process, callback);  
    },
    people_process:function(data){
      console.log(data);
      return data;  
    },
    issues:function(data, callback){
      return this.request('IssuesInProject/'+data.projectID, "GET", this.issues_process, callback);  
    },
    issues_process:function(data){
        console.log(data);
        return data;
    },
    issue:function(data, callback){
        return this.request('Issue/'+data.projectID+'/'+data.issueID, "GET", this.issue_process, callback);
    },
    issue_process:function(data){
      console.log(data);
      return data;  
    },
    create_issue:function(data, callback){
      return this.post('Issue/'+data.projectID, 'POST', 
      {title:data.title, description:data.body,
	  priority_level_id:data.priority_level_id, resolver_id:data.resolver_id, tester_id:data.tester_id}, 
      data.file, this.create_issue_process, callback);  
    },
    create_issue_process:function(data){
      console.log(data);
      return data;  
    },
    create_comment:function(data, callback){
        return this.post('Comment/'+data.projectID+'/'+data.issueID, 'POST', 
        {comment:data.comment}, 
        data.file, this.create_issue_process, callback); 
    },
    create_comment_process:function(data){
        console.log(data);
        return data;
    },
	request: function(path, method, preprocess, callback){
		this.xmlReq.onerror=function(error) {
			callback({}, false);
	        chrome.extension.sendRequest({error:'Error ('+this.status+'): '+this.responseText});
	    };
		this.xmlReq.onreadystatechange=function(){
	 		if (this.readyState==4 && callback){
				if(this.status == 200){
					callback(preprocess(JSON.parse(this.responseText)), true);
				}else{
					callback({}, false);
					chrome.extension.sendRequest({error:'Error ('+this.status+'): '+this.responseText});
				}
		  	}
	  	}

		this.xmlReq.open(
			method,
			this.baseURL + path,
			true);
			

        var requestSig = this.baseURL+path;
        var encodedSig = Crypto.util.bytesToBase64(Crypto.HMAC(Crypto.SHA1, requestSig, this.token, { asBytes: true }));

		this.xmlReq.setRequestHeader("Authorization", "Basic "+base64_encode(this.username+":"+this.password));
        this.xmlReq.setRequestHeader("X-DoneDone-Signature", encodedSig);

		this.xmlReq.send(null);
			
	},
	post: function(path, method, content, file, preprocess, callback){
		this.xmlReq.onerror=function(error) {
			callback({}, false);
	        chrome.extension.sendRequest({error:'Error ('+this.status+'): '+this.responseText});
	    };
		this.xmlReq.onreadystatechange=function(){
			if (this.readyState==4 && callback){
				if(this.status == 200){
					callback(preprocess(JSON.parse(this.responseText)), true);
				}else{
					callback({}, false);
					chrome.extension.sendRequest({error:'Error ('+this.status+'): '+this.responseText});
				}
		  	}
	  	}

		this.xmlReq.open(
			method,
			this.baseURL + path,
			true);
			
        var requestSig = utf8_encode(this.baseURL+path);
        
        content = ksort(content);

        var data = new FormData();
        for(var key in content){
		
            requestSig += key.toLowerCase()+content[key].replace(/[\r]/gm,"");
		
			data.append(key.toLowerCase(), content[key].replace(/[\r]/gm,""));
			
        }
		

        
        
        if(file){
            data.append("Screenshot", dataURItoBlob(file), "Screenshot.jpg");
        }

		console.log(requestSig);
		console.log(btoa(Crypto.HMAC(Crypto.SHA1, requestSig, this.token, { asString: true })));
		
		
        var encodedSig = btoa(Crypto.HMAC(Crypto.SHA1, requestSig, this.token, { asString: true }));

        this.xmlReq.setRequestHeader("Authorization", "Basic "+btoa(this.username+":"+this.password));
        this.xmlReq.setRequestHeader("X-DoneDone-Signature", encodedSig);

		this.xmlReq.send(data);
			
	}
	
};

XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
    function byteValue(x) {
        return x.charCodeAt(0) & 0xff;
    }
    var ords = Array.prototype.map.call(datastr, byteValue);
    var ui8a = new Uint8Array(ords);
    this.send(ui8a.buffer);
}

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
	
	var byteString;
	if (dataURI.split(',')[0].indexOf('base64') >= 0)
		byteString = atob(dataURI.split(',')[1]);
	else
		byteString = unescape(dataURI.split(',')[1]);
	

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
	var bb;
	if (!window.BlobBuilder && window.WebKitBlobBuilder)
		bb = new WebKitBlobBuilder();
	else
		bb = new BlobBuilder();
	
    // write the ArrayBuffer to a blob, and you're done
    bb.append(ab);
    return bb.getBlob(mimeString);
}
