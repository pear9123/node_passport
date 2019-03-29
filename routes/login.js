var express = require('express');
var session = require('express-session');
var router  = express.Router();
var MySQLStore = require('express-mysql-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var mysql = require('mysql');
var flash = require('connect-flash');
var crypto = require('crypto');

// 미들웨어 등록부분
router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json());

router.use(session({
    secret : '123kdkeksEKSE@###@Kdke12',
    resave : true,
    saveUninitialized : true,
    cookie : {maxAge:3600000, httpOnly:true},
    store : new MySQLStore({
        host : 'localhost',
        port : 3307,
        user : 'root',
        password : '',
        database : 'nodejs'
    })
}));

var conn = mysql.createConnection({ // POST 접속
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'nodejs',
    port : 3307
});

conn.connect(); // 접속 완료

router.use(flash());
router.use(passport.initialize()); // passport 초기화
router.use(passport.session()); // passport 인증시 세션 사용하기 위한 위 router.use(session) 뒤에 사용


// 미들웨어 부분
passport.use('local',new LocalStrategy({
    passReqToCallback : true
},function(req, username, password, done){
    console.log("middle ware USERNAME : "+username);
    var sql = "SELECT * FROM TBL_USERS WHERE username = ?";
    conn.query(sql, [username], function(err, rows){
        if(err) {
            console.log("====err====" + err);
            return done(err);
        }
        if(!rows[0]) {
            console.log("=====row[0]====");
            return done(null, false);
        } 
        var user = rows[0];
        var key = "123eee!@";
        var input = password;
        var cipher = crypto.createCipher('aes192',key);
        cipher.update(input,'utf8','base64');
        var output = cipher.final('base64');
        if(output === user.password){
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
}));

passport.serializeUser(function(user, done){
    console.log('serializeUser : ' + user);
    done(null, user.username); // username값을 넘겨줘야함
});

passport.deserializeUser(function(user, done){
    // DB에서 id를 이용하여 user얻어옴
    console.log("deserializeUser ID : "+user);
    var sql = "SELECT * FROM TBL_USERS WHERE username = ?";
    conn.query(sql, [user], function(err, rows){
        if(err) {
            return done(err, false, req.flash('message','check id'));
        }
        if(!rows[0]) {
            return done(err, false, req.flash('message','check id'));
        }
        return done(null, rows[0]);
    });
});

// 로그인 들어왔을때
router.get('/', function(req, res, next){
    if(!req.user){
        res.redirect('/login/login');
    } else {
        res.redirect('/login/welcome');
    }
});
// 로그인 화면
router.get('/login', function(req, res, next){
    if(!req.user){
        res.render('login/loginform', {message : req.flash('insert')});
    } else {
        res.redirect('/login/welcome');
    }
})

// 로그인 성공
router.get('/welcome', function(req, res, next){
    //res.send('<div><p1>로그인성공</p1><br><a href="/">홈으로</a></div>');
    res.render('index',{name:req.user.displayname, title:'Express'});
});
// 회원가입 화면
router.get('/JoinForm', function(req, res, next){
    res.render('login/joinform');
});
// 회원가입 프로세스
router.post('/Join', function(req, res, next){
    var key = "123eee!@";
    var input = req.body.password;
    var cipher = crypto.createCipher('aes192',key);
    cipher.update(input,'utf8','base64');
    var output = cipher.final('base64');
    console.log("====output===="+output);
    var user = {
        authid : 'local:'+req.body.username,
        username : req.body.username,
        password :  output,
        salt : output,
        displayname : req.body.displayname
    }
    var sql = 'INSERT INTO TBL_USERS SET ?';
    conn.query(sql, user, function(err, result){
        if(err) {
            console.log("err : "+err);
            res.status(500);
        } else {
            res.redirect('/login/welcome_join');
        }
    });
});

// 회원가입 완료
router.get('/welcome_join', function(req, res, next){
    res.send('<div><p1>회원가입완료</p1><br><a href="/login">로그인하기</a></div>');
});

// 로그 아웃
router.get('/logout', function(req, res, next){
    req.logout();
    res.redirect('/');
});

// 로그인 프로세스
router.post('/Login_passport',passport.authenticate('local',{
    successRedirect : '/login/welcome',
    failureRedirect : '/login/login',
    failureFlash : true,
    })
);

// 로그인 유저 판단
var isAuthenticated = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login/LoginForm');
}




module.exports = router;