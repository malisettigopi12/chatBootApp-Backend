const req = require("express/lib/request");
const jwt = require("jsonwebtoken");
const mailService = require("../services/mailer");
const catchAsync = require("../utils/catchAsync");
// updated
const crypto = require("crypto");
const filterObj = require("../utils/filterObj");


const otpGenerator = require("otp-generator");

const User = require("../models/user");
const {promisify} = require("util");
const otp = require("../Template/Mail/otp");
const AppError = require("../utils/AppError");

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

exports.register = catchAsync(async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;

    const filteredBody = filterObj(req.body, "firstName", "lastName", "password", "email");

    const existing_user = await User.findOne({ email: email });

    if (existing_user && existing_user.verified) {
        return res.status(400).json({
            status: "error",
            message: "Email is already in use, please login."
        })
        
    }
    else if (existing_user) {
        await User.findOneAndUpdate({ email: email }, filteredBody, 
            { new: true, validateModifiedOnly: true });

        // generate otp and send email to user
        req.userId = existing_user._id;
        next();
    } else {

        // id user record is not available.

        const newUser = new User(filteredBody);
        
        newUser.save();
        // generate otp and send email to user
        req.userId = newUser._id;
        next();
    }
});

exports.sendOTP = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const new_otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });

    const otp_expiry_time = Date.now() + 10 * 60 * 1000 // 10 mins after otp send is expiry time

    const user = await User.findByIdAndUpdate(userId);

    user.otp = new_otp.toString();
    user.otp_expiry_time = otp_expiry_time;

    await user.save({new: true, validateModifiedOnly: true});
    
    console.log(new_otp);
    
    mailService.sendEmail({
        from : "gopamalisetti@gmail.com",
        to: "user.email",
        subject: "OTP send for chatBoot",
        html: otp(user.firstName, new_otp),
        attachments: [],
    })
    
    res.status(200).json({
        status: "success",
        message: "otp send successfully",
    });
});

exports.verifyOTP = catchAsync(async (req, res, next) => {
    // verify OTP and update user record accordingly

    const { email, otp } = req.body;
    console.log(otp);
    const user = await User.findOne({
        email,
        otp_expiry_time: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({
            status: "error",
            message: "Email is invalid or otp expired",
        });
    }

    if(user.verified){
        return res.status(400).json({
            status: "error",
            message: "Email is already verified",
        });
    }

    if(!await user.correctOtp(otp, user.otp)){
        res.status(400).json({
            status: "error",
            message: "wrong otp entered",
        });
        return;
    }

    // otp is correct

    user.verified = true;
    user.otp = otp;

    await user.save({new : true, validateModifiedOnly: true});
    
    const token = signToken(user._id);

    res.status(200).json({
        status: "success",
        message: "otp verified successfully!",
        token,
        user_id: user._id,
    })

});


exports.login = catchAsync(async (req, res, next) => {

    const { email, password } = req.body;
    
    if (!email || !password) {
        res.status(400).json({
            status: "error",
            message: "both email and password are required",
        });

        return;
    }

    const userDoc = await User.findOne({ email: email }).select("+password");
    
    if (!userDoc || !userDoc.password) {
        res.status(400).json({
          status: "error",
          message: "Incorrect password",
        });
        return;
      }

    if (!userDoc || !(await userDoc.correctPassword(password, userDoc.password))) {
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
        user_id: userDoc._id
    })
});


exports.protect = catchAsync(async (req,res,next) => {

    // 1)getting jwt and check if it's there

    let token;
    
    // 'Bearer dsjbd30ibcjkdnclknm'
    if(req.headers.authorization && req.headers.authorization.startswith("Bearer")){
        token = req.headers.authorization.split(" ")[1];




    }else if(req.cookies.jwt){
       
        token = req.cookies.jwt;

    }

    if (!token) {
        return next(
          new AppError(`You are not logged in! Please log in to get access.`, 401)
        );
      }

    // 2) verify token

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
   // 3) check if user still exist;

   const this_user = await User.findById(decoded.userId);

   if (!this_user) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exists.",
        401
      )
    );
  }


   // 4) check if user changed their password after token was issued.

    if (this_user.changedPasswordAfter(decoded.iat)) {
       return next(
      new AppError("User recently changed password! Please log in again.", 401)
      );
    }

   req.user = this_user;

   next();
});

exports.forgotPassword = catchAsync(async(req, res, next) => {
    
    const user = await User.findOne({email: req.body.email});

    if (!user) {
        return next(new AppError("There is no user with email address.", 404));
    }
    console.log("nbvb,jh")
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try{

        // TODO => Send Email With Reset URL
        const resetURL = `https://gopi.com/auth/reset-password/?code=${resetToken}`;

        console.log(resetToken);

        res.status(200).json({
            status: "success",
            message: "reset password link sent to email successfully"
        })

    }catch(err){
        
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({validateBeforeSave: false});

         return next(
            new AppError("There was an error sending the email. Try again later!"),
            500
            );
    }
});

exports.resetPassword = catchAsync(async(req, res, next) => {

    const hashedToken = crypto.createHash("sha256").update(req.body.token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt : Date.now()},
    });

    if (!user) {
        return next(new AppError("Token is invalid or has expired", 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user,passwordChangedAt = Date.now();

    await user.save();
     

    // TODO send email to user informing password reset.


    // jwt token send to login 
    res.status(200).json({
        status: "success",
        message: "reset password was successfully",
    })

    
})