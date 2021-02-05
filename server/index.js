// 서버 생성
const express = require('express')
const app = express()

// 모듈 추출
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser'); // 요청된 쿠키를 쉽게 추출
const config = require('./config/key');
const { auth } = require('./middleware/auth');
const { User } = require('./models/User');

//application/x-www-form-urlencoded 방식의 Content-Type 데이터 받아줌 (jQuery.ajax의 기본타입)
app.use(bodyParser.urlencoded({extended: true}));
//application/json
app.use(bodyParser.json());
app.use(cookieParser());


const mongoose = require('mongoose')

mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
    }).then(()=> console.log('MongoDB Connected...'))
    .catch(err => console.log(err))

    app.get('/', (req, res) => res.send('Hello World! Nodemon 짱인데?'))

    app.get('/api/hello', (req, res) => {
        res.send('ajax cors')
    })


    app.post('/api/users/register', (req, res) => {
        // 회원가입 할 때 필요한 정보들을 client에서 가져오면
        // 그것들을 데이터베이스에 넣어줌
        const user = new User(req.body)
        user.save((err, user) => {
            if(err) return res.json({ success: false, err})
            return res.status(200).json({
                success: true
            })
        })
    })

    app.post('/api/users/login', (req, res) => {
        // 요청한 email이 DB에 존재하는지 확인
        User.findOne( {email: req.body.email}, (err, user) => {
            if(!user) { // 유저가 없다면
                return res.json({
                    loginSuccess: false,
                    message: "제공된 이메일에 해당하는 유저가 없습니다."
                })
            }
        
        // 요청한 email이 DB에 존재하면 비밀번호가 일치하는지 확인
        user.comparePassword(req.body.password, (err, isMatch) => {
            // console.log('err', err)
            // console.log('isMatch', isMatch)
            if (!isMatch)
                return res.json({ 
                    loginSuccess: false, 
                    message: "비밀번호가 틀렸습니다." 
                })

            // 비밀번호까지 같다면 토큰 생성
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err)
                // 토큰을 저장한다. 어디에? 쿠키 or 로컬스토리지, 세션 스토리지
                    res.cookie("x_auth", user.token)
                    .status(200)
                    .json({
                        loginSuccess: true, 
                        userId: user._id
                    }) 
            })
        })
    })
})


// role 0 == 일반유저 role != 0 관리자
app.post('/api/users/auth', auth , (req, res) => {
    console.log("통과함")
    // 여기까지 미들웨어를 통과해왔다 -> Authentication True
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        image: req.user.image
    })
})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id }, 
        { token: ""}
        , (err, user) => {
            if(err) return res.json({ success: false, err });
            return res.status(200).send({
                success: true
            })
        })
 })


 const port = 5000

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
