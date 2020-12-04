var requestIdMap = {}

async function init() {
    chrome.webRequest.onBeforeRequest.addListener(function (req) {

            if(req.type == 'xmlhttprequest'){
                console.log(req)

                var data = {'method':req.method,'url':req.url}

                // 参考 https://developer.chrome.com/extensions/webRequest#event-onBeforeRequest
                if(req.method =='POST' && 'requestBody' in req && 'raw' in req.requestBody && 'bytes' in req.requestBody.raw[0] ){

                    var requestBodyStr = decodeURIComponent(String.fromCharCode.apply(null,new Uint8Array(req.requestBody.raw[0].bytes)))
                    data.requestBody = requestBodyStr
                }

                requestIdMap[req.requestId] = data
            }
        },
        {urls: ["<all_urls>"]},
        ["blocking", "requestBody"]
    );


    chrome.webRequest.onBeforeSendHeaders.addListener(function (req) {

            if(req.requestId in requestIdMap){
                console.log(req)

                var data = requestIdMap[req.requestId]

                data.requestHeaders = req.requestHeaders

                chrome.extension.sendMessage(data)
            }
        },
        {urls: ["<all_urls>"]},
        ["blocking", "requestHeaders"]);



}

init()
