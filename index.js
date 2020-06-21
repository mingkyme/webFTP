const express = require('express');
const fs = require('fs');
const path = require('path');
const dateFormat = require('dateformat');
const ROOT_PATH = "/home/usb/ROOT/";
var server = express();
server.set('view engine','ejs');
server.set('views',__dirname+'/views');
server.get('/',function(req,res){
    var targetPath = req.query.path ? path.join(ROOT_PATH,req.query.path) : ROOT_PATH;

    var resultFolderList = new Array();
    var resultFileList = new Array();

    if(!fs.existsSync(targetPath)){
        res.sendStatus(404);
        return;
    }
    if( targetPath != ROOT_PATH && !fs.realpathSync(targetPath).startsWith(ROOT_PATH)){
        res.sendStatus(404);
        return;
    }
    fs.readdir(targetPath,(error, fileList)=>{
        if(error){
            console.log(error);
        }else{
            for (var i=0;i<fileList.length;i++){
                var singleResult = new Object();
                tempState = fs.lstatSync(path.join(targetPath,fileList[i]));
                singleResult.name = fileList[i];
                singleResult.size = BytesToSize(tempState.size);
                singleResult.date = dateFormat(tempState.ctime,"yyyy-mm-dd HH:MM");
                if(fs.statSync(path.join(targetPath,fileList[i])).isDirectory()){
                    resultFolderList.push(singleResult);
                }else{
                    resultFileList.push(singleResult);
                }
            }
            res.render('ftp',{
                "Folders":resultFolderList,
                "Files":resultFileList
            });
        }
        
    });
});
server.get('/download',(req,res)=>{
    if(!req.query.path){
        res.sendStatus(404);
    }
    var targetPath = path.join(ROOT_PATH,req.query.path);
    if(!fs.existsSync(targetPath)){
        res.sendStatus(404);
        return;
    }
    if( targetPath != ROOT_PATH && !fs.realpathSync(targetPath).startsWith(ROOT_PATH)){
        res.sendStatus(404);
        return;
    }
    res.download(targetPath);

});
server.listen(10050, function () {
    console.log('Start Server');
});
function BytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
 }
