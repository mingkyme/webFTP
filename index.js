const express = require('express');
const server = express();
var fs = require('fs');
var path = require('path');
const ROOT_PATH = "/home/usb/ROOT/";
server.set('view engine','ejs');
server.set('views',__dirname+'/views');
server.get('/',function(req,res){
    var targetPath = req.query.path ? path.join(ROOT_PATH,req.query.path) : ROOT_PATH;
    var resultFolderList = new Array();
    var resultFileList = new Array();
    // res.send(path.join(ROOT_PATH,targetPath));
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
                if(fs.statSync(path.join(targetPath,fileList[i])).isDirectory()){
                    
                    resultFolderList.push(fileList[i]);
                    
                }else{
                    resultFileList.push(fileList[i]);
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
