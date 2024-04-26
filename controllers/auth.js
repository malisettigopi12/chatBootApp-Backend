const req = require("express/lib/request");
const jwt = require("jsonwebtoken");
const mailService = require("../services/mailer");

const otpGenerator = require("otp-generator");

const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const {promisify} = require("util");


const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

exports.register = async (req, res, next) => {
    const { firstNAme, lastName, email, password } = req.body;

    const filteredBody = filterObj(req.body, "firstName", "lastName", "password", "email");

    const existing_user = await User.findOne({ email: email });

    if (existing_user && existing_user.verified) {
        res.status(400).json({
            status: "error",
            message: "Email is already in use, please login."
        })
        return;
    }
    else if (existing_user) {
        await User.findOneAndUpdate({ email: email }, filteredBody, { new: true, validateModifiedOnly: true });

        // generate otp and send email to user
        req.userId = existing_user._id;
        next();
    } else {

        // id user recprd is not available.

        const newUser = await User.create(filteredBody);

        // generate otp and send email to user
        req.userId = new_user._id;
        next();
    }
};

exports.sendOTP = async (req, res, next) => {
    const { userId } = req;
    const new_otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });

    const otp_expiry_time = Date.now() + 10 * 60 * 1000 // 10 mins after otp send is expiry time

    await User.findByIdAndUpdate(userId, {
        otp: new_otp,
        otp_expiry_time,
    });

    // todo send mail
    
    mailService.sendEmail({
        from : "gopamalisetti@gmail.com",
        to: "example@gmail.com",
        subject: "OTP send for chatBoot",
        text: `Your OTP is ${new_otp}. this is valid for 10 minutes.`,
    }).then(()=>{

    }).catch((err)=>{
        
    })
    
    res.status(200).json({
        status: "success",
        message: "otp send successfully",
    });
};

exports.verifyOTP = async (req, res, next) => {
    // verify OTP and update user record accordingly

    const { email, otp } = req.body;

    const user = await User.findOne({
        email,
        otp_expiry_time: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400).json({
            status: "error",
            message: "Email is invalid or otp expired",
        });

        return;
    }

    if(!await user.correctOtp(ptp, user.otp)){
        res.status(400).json({
            status: "error",
            message: "wrong otp entered",
        });
        return;
    }

    // otp is correct

    user.verified = true;
    user.otp = undefined;

    await user.save({new : true, validateModifiedOnly: true});
    
    const token = signToken(user._id);

    res.status(200).json({
        status: "success",
        message: "otp verified successfully!",
        token,
    })

}


exports.login = async (req, res, next) => {

    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            status: "error",
            message: "both email and password are required",
        });

        return;
    }

    const userDoc = await User.findOne({ email: email }).select("+password");

    if (!userDoc || await userDoc.correctPassword(password, userDoc.passowrd)) {
        res.status(400).json({
            status: "error",
            message: "email or password is incorrect",
        })
        return;
    }

    const token = signToken(userDoc._id);

    res.status(200).json({
        status: "successful",
        message: "user login was successful",
        token,
    })
};


exports.protect = async (req,res,next) => {

    // 1)getting jwt and check if it's there

    let token;
    
    // 'Bearer dsjbd30ibcjkdnclknm'
    if(req.headers.authorization && req.headers.authorization.startswith("Bearer")){
        token = req.headers.authorization.split(" ")[1];




    }else if(req.cookies.jwt){
       
        token = req.cookies.jwt;

    }else{

        res.status(400).json({
            status: "error",
            message: "you are not logged in,please login, to get access",
        })
        return;
    }

    // 2) verify token

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
   // 3) check if user still exist;

   const this_user = await User.findById(decoded.userId);

   if(!this_user){
    res.status(400).json({
        status: "error",
        message: "The user doesn't exist",
    })
    return;
   }


   // 4) check if user changed their password after token was issued.

   if(this_user.changedPasswordAfter(decoded.iat)){
       res.status(400).json({
           status: "error",
           message: "user recently updated password! please log in again"
       });
       return;
   }

   req.user = this_user;

   next();
}

exports.forgotPassword = async(req, res, next) => {
    
    const user = User.findOne({email: req.body.email});

    if(!user){
        res.status(400).json({
            status: "error",
            message: "user not found",
        });
        return;
    }

    const resetToken = user.createPasswordResetToken();

    const resetURL = `https://gopi.com/auth/reset-password/?code=${resetToken}`;

    try{

        // TODO => Send Email With Reset URL

        res.status(200).json({
            status: "success",
            message: "reset password link sent to email successfully"
        })

    }catch(err){
        
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({validateBeforeSave: false});

        res.status(500).json({
            status: "error",
            message: "there was an error sending the email, please try again after some time",
        })
    }
}

exports.resetPassword = async(req, res, next) => {

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$t : Date.now()},
    });

    if(!user){
        res.status(400).json({
            status: "error",
            message: "invalid token send or token expired!",
        })
        return;
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user,passwordChangedAt = Date.now();

    await user.save();
     

    // TODO send email to user informing password reset.


    // jwt token send to login 
    const token = signToken(user._id);
    
    res.status(200).json({
        status: "success",
        message: "reset password was successfully",
        token,
    })

    
}