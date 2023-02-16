//@ts-nocheck
import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import session, { Session } from 'express-session';
import MongoStore from 'connect-mongo'
import passport from 'passport';
import bcrypt, { hashSync, compareSync } from 'bcrypt';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken'
import './passport';
import LocalStrategy from 'passport-local';
import { connectDb } from './db/connect';
import { User } from './modals/user';

const app = express();
dotenv.config()


app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
        mongoUrl: process.env.DBURL,
        collectionName: 'sessions'
        // mongoOptions: advancedOptions // See below for details
    }),
    resave: false,
    saveUninitialized: true,
    cookie: {
        // user 只能透過https連線你的web才能回傳cookie,如果是為true需要新增信任網域 https://expressjs.com/zh-tw/guide/behind-proxies.html
        secure: false,
        // 強制將session存回 session store, 即使它沒有被修改
        resave: false,
        // 強制將未初始化的session存回 session store，未初始化的意思是它是新的而且未被修改。
        saveUninitialized: false,
        // 不能透過瀏覽器的開發者工具寫js腳本讀取cookie
        httponly: true,
        maxAge: 30000,
    }
}))
app.use(express());
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
//Persists user data inside session
passport.serializeUser((user, cb) => {
    process.nextTick(function () {
        return cb(null, user.id);
    });
})
//Fetches session details using session id
passport.deserializeUser(function (id, cb) {
    User.findById(id, function (err, user) {
        cb(err, user)
    })
});

app.get('/', (req: Request, res: Response) => {
    if (req.session.viewCount) {
        req.session.viewCount++;
    } else {
        req.session.viewCount = 1
    }
    res.json('hello world ' + req.session.viewCount)
})


app.post('/register', async (req, res) => {
    console.log(req.body)
    const duplicateUser = await User.findOne({ username: req.body.username })
    if (duplicateUser) return res.json({ message: 'username has been register' })
    let user = new User({
        username: req.body.username,
        password: hashSync(req.body.password, 10)
    })

    user.save().then(user => console.log(user));

    res.send({ success: true })
})
app.post('/login', async (req: Request<any, any, { username: string, password: string }>, res: Response) => {
    const { username, password } = req.body
    if (!username || !password) return res.json({ message: 'empty username or password' })
    const user = await User.findOne({ username: req.body.username })
    if (!user) return res.json({ message: 'invlidate username' })
    if (!compareSync(password, user.password)) return res.json({ message: 'invlidate password' })
    const payload = {
        username,
        id: user.id
    }
    const jsonToken = jwt.sign(payload, 'Kjhg2365987', { expiresIn: '1d' })
    return res.status(200).json({
        sussess: true,
        message: 'Logged in successfully',
        token: 'Bearer ' + jsonToken
    })
})
app.get('/protected', passport.authenticate('jwt', { session: true }), (req, res) => {
    console.log(req.user)
    return res.json({
        user: req.user.username
    })
})
app.listen(process.env.PORT, async () => {
    await connectDb()
    console.log(`server listening on port ${process.env.PORT}`);
})
// process.nextTick(()=>{
//     console.log('nextTick')
// })
// console.log(1)