var recording = false
var filter = ""

function startRecord(){
    recording = true;
    filter = $("#filter").val();
}

function stopRecord(){
    recording = false;
}

$(function () {
    $("#startRecord").on('click',startRecord)
    $("#stopRecord").on('click',stopRecord)

    $("#save").on('click',function () {
        stopRecord();

        var requests = []
        $(".container .row").not('.title').each(function () {
            if($(this).find(".item").is(':checked')){
                var item = {
                    "method":$(this).find(".method").text(),
                    "url":$(this).find(".url").text(),
                    "params":$(this).find(".params").text(),
                    "headers":$(this).find(".headers").text()
                }

                requests.push(item)
            }
        })

        var data = {
            "blue":{
                "headers":JSON.parse($(".blue .headers").val()),
                "params":JSON.parse($(".blue .params").val())
            },
            "green":{
                "headers":JSON.parse($(".green .headers").val()),
                "params":JSON.parse($(".green .params").val())
            },
            "requests":requests
        }


        chrome.storage.local.set({'data':data})
    })

    $("#replay").on('click',function () {
        stopRecord();

        chrome.storage.local.get('data', function(res){
            var data = res.data
            $(data.requests).each(function (index, obj) {
                if(obj.method == "POST"){
                    post(obj,data.green,function (greenResult) {
                        post(obj,data.blue,function (blueResult) {
                            handleResult(greenResult,blueResult)
                        })
                    })
                }else{
                    get(obj,data.green,function (greenResult) {
                        get(obj,data.blue,function (blueResult) {
                            handleResult(greenResult,blueResult)
                        })
                    })
                }
            })
        });
    })

    function handleResult(greenResult,blueResult){
        console.log(Compare(greenResult,blueResult),greenResult,blueResult)
    }

    $("#download").on('click',function () {
        chrome.storage.local.get('data', function(res) {
            var data = res.data

            var content = JSON.stringify(data);
            var blob = new Blob([content ], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "bgtest.json");
        })
    })

    $("#upload").on('change',function (e) {
        if(e.target.files.length > 0){
            var file = e.target.files[0]

            if (window.FileReader) {
                var reader = new FileReader();
                reader.onloadend = function (evt) {
                    if (evt.target.readyState == FileReader.DONE) {
                        try {
                            var data = JSON.parse(evt.target.result)
                            chrome.storage.local.set({'data':data})
                            console.info("加载配置成功")
                        }catch (e) {
                            console.error("解析文件出错",e)
                        }
                    }
                };
                // 包含中文内容用gbk编码
                reader.readAsText(file);
            }
        }
    })

    $(".all").on('click',function () {
        var checked = $('.all').is(':checked')
        $(".container input:checkbox.item").attr("checked", checked)
    })




    chrome.extension.onMessage.addListener(
        function(data, sender, sendResponse) {
            console.log(data)
            if(!recording){
                return
            }

            let url = data.url;
            if(url.indexOf(filter) < 0){
                return
            }

            var row = $($("#tpl").html())
            row.find(".method").text(data.method)
            row.find(".url").text(url)
            row.find(".params").text(data.requestBody)
            row.find(".headers").text(JSON.stringify(data.requestHeaders))

            $(".container").append(row)
        });
})

var headersBlackList  = new Set(['User-Agent'])
function post(reqParam, groupParam, callback) {
    var data = reqParam.params?JSON.parse(reqParam.params):{}
    $.extend(data,groupParam.params)

    var headersPairs = reqParam.headers?JSON.parse(reqParam.headers):{}
    var headers = {}
    $(headersPairs).each(function (index, obj) {
        if(headersBlackList.has(obj.name)){
            return
        }
        headers[obj.name] = obj.value
    })

    $.extend(headers,groupParam.headers)

    $.ajax({
        type: "POST",
        headers:headers,
        url: reqParam.url,
        data:JSON.stringify(data),
        success: function(result) {
            if(callback){
                callback(result)
            }
        }
    });
}

function get(reqParam, groupParam, callback) {
    var data = groupParam.params

    $.ajax({
        type: "GET",
        headers:groupParam.headers,
        url: reqParam.url,
        data:data,
        success: function(result) {
            if(callback){
                callback(result)
            }
        }
    });
}

