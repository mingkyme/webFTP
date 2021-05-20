const express = require('express');
const fs = require('fs');
const path = require('path');
const dateFormat = require('dateformat');
const multer  = require('multer');
const session = require('express-session');
const FileStore = require('session-file-store')(session); // 1
const password = require('./password/password.json')
const ROOT_PATH = password.ROOT_PATH;
const ADMIN_ID = password.ADMIN_ID;
const ADMIN_PW = password.ADMIN_PW;
var upload = multer({storage: multer.memoryStorage()});
var app = express();
app.use(express.json());
app.use(express.urlencoded( {extended : false } ));
app.use(session({  // 2
    secret: password.SECRET,
    resave: false,
    saveUninitialized: true,
    store: new FileStore()
  }));
app.set('view engine','ejs');
app.set('views',__dirname+'/views');
app.post('/login',(req,res)=>{
    if(req.body.id == ADMIN_ID && req.body.pw == ADMIN_PW){
        req.session.logined = true;
        res.redirect('/');
    }else{
        res.send("실패");
    }
});
app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/');
})
app.get('/',function(req,res){
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
                "folders":resultFolderList,
                "files":resultFileList,
                "isAdmin":req.session.logined
            });
        }
        
    });
});
app.get('/download',(req,res)=>{
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

app.post('/file',upload.single("file"),function(req,res){
    // upload file
    if(req.session.logined){
        var fileName = req.file.originalname;
        var targetPath = path.join(ROOT_PATH,req.body.path,fileName);
        if(!targetPath.startsWith(ROOT_PATH)){
            res.send("error");
            return;
        }
        if(fs.existsSync(targetPath)){
            res.send("이미 존재합니다.");
        }else{
            fs.writeFileSync(targetPath,req.file.buffer);
            res.redirect('/');
        };
    }else{
        res.send("실패");
    }
});
app.delete('/file',function(req,res){
    // delete file
    if(req.session.logined){
        var targetPath = path.join(ROOT_PATH,fileName);
        if(!targetPath.startsWith(ROOT_PATH)){
            res.send("error");
            return;
        }
        fs.unlink(targetPath,function(err){
            if(err){
                console.log(err);
            }
        })
    }
});

app.put('/folder',function(req,res){
    // new folder
    if(req.session.logined){
        var targetPath = path.join(ROOT_PATH,req.body.path,req.body.name);
        if(!targetPath.startsWith(ROOT_PATH)){
            res.send("error");
            return;
        }
        if(fs.existsSync(targetPath)){
            res.send("이미 존재합니다.");
        }else{
            fs.mkdirSync(targetPath);
            res.redirect('/');
        };
    }else{
        res.send("실패");
    }
});
app.delete('/folder',function(req,res){
    // delete folder
    if(req.session.logined){
        var targetPath = path.join(ROOT_PATH,req.body.path,req.body.name);
        if(!targetPath.startsWith(ROOT_PATH)){
            res.send("error");
            return;
        }
        fs.rmdir(targetPath,function(err){
            if(err){
                console.log(err);
            }
        });
    }
});
app.listen(10050, function () {
    console.log('Start app');
});
function BytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
 }
