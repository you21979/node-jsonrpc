var LimitRequestPromise = require('limit-request-promise');
var errors = require("limit-request-promise/errors");
var HttpApiError = require("@you21979/http-api-error")

var makeCookieAuth = function(user, password){
    return new Buffer(user + ':' + password).toString('base64')
}

var makeContent = function(id, method, params){
    return JSON.stringify({jsonrpc: "1.0", id:id, method: method, params: params });
}

var makeOption = function(url, auth, content, timeout){
    return {
        url : url,
        method : "POST",
        timeout : timeout,
        forever : true,
        headers : {
          "Authorization" : "Basic " + auth,
        },
        form : content,
        transform2xxOnly : true,
        transform : function(res){
            return JSON.parse(res);
        }
    }
}

var request = function(lrp, option){
    return lrp.req(option)
        .catch(errors.StatusCodeError, function(e){
            return JSON.parse(e.error)
        })
        .then(function(res){
            if(res.error) throw new HttpApiError(res.error.message, 'GENERIC', res.error.code)
            else return res.result
        })
}

var JsonRPC = function(url, user, pass, timeout){
    this.lrp = new LimitRequestPromise(1, 0.02);
    this.url = url;
    this.auth = makeCookieAuth(user, pass);
    this.timeout = timeout;
    this.num = 0;
}

JsonRPC.prototype.seq = function(){
    return ++this.num;
}

JsonRPC.prototype.request = function(method, params){
    return request(this.lrp, makeOption(this.url, this.auth, makeContent(this.seq(), method, params), this.timeout))
}

module.exports = JsonRPC

