const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10; // 값이 높을수록 비용소요 큼 
                       // saltRound : salt가 몇글자인지 나타내는 것
const jwt = require('jsonwebtoken'); // 회원 로그인이 완료 되었을때 발행되는 토큰

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0 // 1 - 관리자, 0 - 사용자
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: { // 유효기간 설정
        type: Number
    }
})

// mongoose의 pre 기능으로 'save' 하기 전에 function 실행
userSchema.pre('save', function( next ){
    var user = this;
    if(user.isModified('password')){  // 비밀번호 변경할 때만 암호화하기 위한 조건

        // 비밀번호 암호화
        bcrypt.genSalt(saltRounds, function(err, salt){  // 콜백함수로 err와 salt를 넘김
            if(err) return next(err)
            bcrypt.hash(user.password, salt, function(err, hash){  // hash : 암호화된 비밀번호
                if(err) return next(err);
                user.password = hash
                next() // index.js의 save로 되돌아감
            })
        })
    } else {
        next()
    }
})

// cb: call back
userSchema.methods.comparePassword = function(plainPassword, cb) {
    // plainPassword 123456  암호화된 비밀번호 $2b$10$P2fi6E3pgjIRbZded.ZJOenyiCCNRAvHiYJW40dUht/lk3o92PMCO
    // 이 두개가 맞는지 확인하는 과정이 필요함
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cb(err)
        cb(null, isMatch)
    })
}

userSchema.methods.generateToken = function(cb) {
    var user = this;
    // jsonwebtoken을 이용해서 token을 생성하기
    var token = jwt.sign(user._id.toHexString(),  'secretToken')
    // toHexString() or toJSON()
    // 없으면 => Error: Expected "payload" to be a plain object.

    // user._id + 'secretToken' = token
    // ->
    // 'secretToken' -> user._id
    user.token = token
    user.save(function(err,user){
        if(err) return cb(err)
        cb(null, user)
    })
}

userSchema.statics.findByToken = function(token, cb) {
    var user = this;
    // user._id + '' = token 
    // 토큰을 decode 한다.
    jwt.verify(token, 'secretToken', function(err, decoded){
        // 유저 아이디를 이용해서 유저를 찾은 다음,
        // 클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인

        user.findOne({"_id": decoded, "token": token}, function(err, user){
            if(err) return cb(err);
            cb(null, user)
        })
    })
}


const User = mongoose.model('User', userSchema)


module.exports = {User}