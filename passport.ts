import passport from 'passport';
import passportJWT, { StrategyOptions } from 'passport-jwt'
import { User } from './modals/user';
const JwtStrategy = passportJWT.Strategy,
    ExtractJwt = passportJWT.ExtractJwt;
const opts = {} as StrategyOptions
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'Kjhg2365987';

//這是passport的middler，jwt_payload則你在req.herder.authorization的JWT，decode的payload,如果驗證成功done會把user data傳到req.user中
passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    console.log(jwt_payload, done)
    try {
        const user = await User.findOne({ id: jwt_payload.id })
        if (user) {
            return done(null, user);
        }
    } catch (e) {
        return done(e, false);
    }
    // User.findOne({ id: jwt_payload.sub }, function (err: any, user: any) {
    //     if (err) {
    //         return done(err, false);
    //     }
    //     if (user) {
    //         return done(null, user);
    //     } else {
    //         return done(null, false);
    //         // or you could create a new account
    //     }
    // });
}));

