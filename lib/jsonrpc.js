var rp = require("request-promise");
var errors = require("request-promise/errors");
var HttpApiError = require("@you21979/http-api-error")

var makeCookieAuth = function(user, password){
    return new Buffer(user + ':' + password).toString('base64')
}

var makeContent = function(id, method, params){
    return JSON.stringify({ jsonrpc: '2.0', method: method, params: params, id: id });
}

var makeOption = function(url, auth, content, timeout){
    return {
        url : url,
        method : "POST",
        timeout : timeout,
        headers : {
          "Authorization" : "Basic " + auth,
        },
        form : content,
        transform2xxOnly : true,
        transform : (res) => JSON.parse(res),
    }
}

var request = function(option){
    return rp(option)
        .catch(errors.StatusCodeError, function(e){
            return JSON.parse(e.error)
        })
        .then(res => {
            if(res.error) throw new HttpApiError(res.error.message, 'GENERIC', res.error.code)
            else return res.result
        })
}

var JsonRPC = function(url, user, pass, timeout){
    this.url = url;
    this.auth = makeCookieAuth(user, pass);
    this.timeout = timeout;
    this.seq = 0;
}

JsonRPC.prototype.request = function(method, params){
    return request(makeOption(this.url, this.auth, makeContent(++this.seq, method, params), timeout))
}

module.exports = JsonRPC

