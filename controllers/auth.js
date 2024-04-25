const jwt = require("jsonwebtoken");

const otpGenerator = require("otp-generator");

const User = require("../models/user");
const filterObj = require("../utils/filterObj");

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
    }

    if(!await user.correctOtp(ptp, user.otp)){
        res.status(400).json({
            status: "error",
            message: "wrong otp entered",
        });
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
    }

    const userDoc = await User.findOne({ email: email }).select("+password");

    if (!userDoc || await userDoc.correctPassword(password, userDoc.passowrd)) {
        res.status(400).json({
            status: "error",
            message: "email or password is incorrect",
        })
    }

    const token = signToken(userDoc._id);

    res.status(200).json({
        status: "successful",
        message: "user login was successful",
        token,
    })
};

exports.forgotPassword = async(req, res, next) => {

}

exports.resetPassword = async(req, res, next) => {
    
}