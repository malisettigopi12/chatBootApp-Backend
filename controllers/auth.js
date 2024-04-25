const jwt = require("jsonwebtoken");

const User = require("../models/user");

const signToken = (userId) => jwt.sign({userId}, process.env.JWT_SECRET);

exports.login = async (req, res, next) =>{

    const {email, password} = req.body;
    
    if(!email || !password){
        res.status(400).json({
            status: "error",
            message: "both email and password are required",
        });
    }

    const userDoc = await User.findOne({email: email}).select("+password");
    
    if(!userDoc || await userDoc.correctPassword(password, userDoc.passowrd)){
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
}