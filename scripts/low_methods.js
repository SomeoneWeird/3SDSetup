var bufferList = new Object();
var finalZip = new JSZip();

function getFileBuffer_url(url,name){    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.onprogress = function(e){
        if (e.lengthComputable){
            var percent = Math.floor((e.loaded / e.total) * 100);
            progress(name,"Download " + name + ": " + percent);
        }
    };
    xhr.onload = function () {
         var fileBlob = new Blob([xhr.response]);
        
        if (this.status === 200) {
            var fileReader = new FileReader();
            fileReader.onload = function() {
                bufferList[name] = this.result;
            };
            fileReader.readAsArrayBuffer(fileBlob);
            progress(name,"Download " + name + ": Complete");
            
        }
    };
    xhr.send();
    progress(name,"Download " + name + ": ongoing");
}

function getFileBuffer_zip(bufferName,original_name,new_name,path){
    if(bufferList[bufferName] == undefined){
        console.log("Extract " + original_name + " from " + bufferName + " delayed");
        setTimeout(function(){ getFileBuffer_zip(bufferName,original_name,new_name,path)},500);
    }else{
    
        JSZip.loadAsync(bufferList[bufferName]).then(function (data) {        
            data.file(original_name).async("arraybuffer").then(function success(content){
                addFile(content,path,new_name,"buffer");
                progress(bufferName, bufferName + ": Added to zip file");
            })                                
        });
    }
}

function extractZip(bufferName,path,remove_path){
    if(bufferList[bufferName] == undefined){
        console.log("Extract " + bufferName + " delayed");
        setTimeout(function(){ extractZip(bufferName,path,remove_path);},500);
    }else{
        JSZip.loadAsync(bufferList[bufferName]).then(function (data) {
            progress(bufferName, bufferName + ": Extracting");
            var file_count = 0;
            
            //Code snippet from @jkcgs :3
            Object.keys(data.files).forEach(function(key){
                var file = data.files[key];
                var file_name = file.name;
                if(remove_path != ""){var file_name = (file_name).replace(remove_path + "/","");};
                if (file.dir) {
                    file_count++;
                    return;
                }

                file.async("arraybuffer").then(function(content) {
                    file_count++;
                    
                    addFile(content, path, file_name, "buffer");

                    if(file_count == Object.keys(data.files).length){
                        progress(bufferName, bufferName + ": Added to zip file");
                    }
                    
                });
            });               
        })
    }
    
}

function addFile(name,path,filename,origin){
    //origin either "list" or "buffer"
    
    var buffer;
    switch(origin){
        case "list":
            buffer = bufferList[name];
            break;
        case "buffer":
            buffer = name;
            break;
    }
    
    if(buffer == undefined){
        setTimeout(function(){ addFile(name,path,filename,origin);},500);
    }else{                
        if(path == ""){
            finalZip.file(filename,buffer);
        }else{
            finalZip.folder(path).file(filename,buffer);
        }
        
        if(origin == "list"){
            progress(name, name + ": Added to zip file");
        }
        console.log(finalZip);
    }
}

function progress(step,message){
    if(document.getElementById(step) !== null){
        document.getElementById(step).innerHTML = message;
    }else{
        $("#progress").append("<div id='" + step + "'>" + message + "</div>");
    }
}


function downloadZip(){
    finalZip.generateAsync({type:"blob"})
    .then(function (blob) {
        saveAs(blob, "plairekt.zip");
    });
}
