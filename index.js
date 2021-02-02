const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');

const config = require('./config/key');
const { User } = require("./models/User");

//application/x-www-form-urlencoded 방식의 Content-Type 데이터 받아줌 (jQuery.ajax의 기본타입)
app.use(bodyParser.urlencoded({extended: true}));
//application/json
app.use(bodyParser.json());

const mongoose = require('mongoose')
mongoose.connect('', {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(()=> console.log('MongoDB Connected...'))
.catch(err => console.log(err))

 app.get('/', (req, res) => res.send('Hello World! Nodemon 짱인데?'))

app.post('/register', (req, res) => {
    
    // 회원가입 할 때 필요한 정보들을 client에서 가져오면
    // 그것들을 데이터베이스에 넣어줌
    const user = new User(req.body)
    user.save((err, userInfo) => {
        if(err) return res.json({ success: false, err})
        return res.status(200).json({
            success: true
        })
    })
})



app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
