const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        require: [true, "first name is required"],
    },
    lastName: {
        type: String,
        require: [true, "last name is required"],
    },
    avatar: {
        type: String,
    },
    email: {
        type: String,
        require: [true, "email is required"],
        validate: {
            validator: function (email) {
                return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
            },
            message: (props) => `Email (${props.value})is invalid!`,
        },
    },
    about: {
        type: String,
    },
    password: {
        type: String,
    },
    passwordConfirm:{
        type: String,
    },
    passwordChangedAt: {
        type: Date,
    },

    passwordResetToken: {
        type: String,
    },

    passwordResetExpires: {
        type: Date,
    },

    createAt: {
        type: Date,
    },

    updatedAt: {
        type: Date,
    },

    verified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
    },
    otp_expiry_time: {
        type: Date,
    }

});

userSchema.pre("save", async function (next) {

    // encrypt otp before save it.

    // only run these function if OTP is actually modified.
    if (this.isModified("otp")  || this.otp) {
        this.otp = await bcrypt.hash(this.otp.toString(), 12);
        console.log(this.otp.toString(), "FROM PRE SAVE HOOK")
    }

    // hash the otp with cost of 12(more value more tough encryption (8 - 16));
    
    if(!this.password) return next();

    this.password =  await bcrypt.hash(this.password, 12);
    
    if(this.passwordConfirm) this.passwordConfirm = await bcrypt.hash(this.passwordConfirm, 12);
    // hash the password with cost of 12(more value more tough encryption (8 - 16));
    console.log("hello from pre")
    
    if(this.isModified("password") && !this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
        console.log("ggg")
    }
    
    console.log("hello from post")
    next();
});

// userSchema.pre("save", async function (next) {

//     // encrypt password before save it.

//     // only run these function if password is actually modified.
//     if (!this.isModified("password") || !this.password) return next();

//     // hash the password with cost of 12(more value more tough encryption (8 - 16));
//     this.password = await bcrypt.hash(this.password, 12);
//     console.log("hello from pre")
    
//     if(!this.isNew) this.passwordChangedAt = Date.now() - 1000;
//     next();
// });

// userSchema.pre('save', function (next) {
//     if (!this.isModified('password') || this.isNew || !this.password) return next();

//     this.passwordChangedAt = Date.now() - 1000;
//     next();
// });


// above three pre can be merged into one.


userSchema.methods.correctPassword = async function (
    candidatePassword, // 123456
    userPassword // shddjucbkn39oldcml
) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.correctOtp = async function (
    candidateOtp, // 123456 (frontend)
    userOtp // shddjucbkn39oldcml (bycrpted otp, using these the original value can be decrypted)
) {
    return await bcrypt.compare(candidateOtp, userOtp);
}

userSchema.methods.createPasswordResetToken = function () {

    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {

    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimeStamp < changedTimeStamp;
    }
}

const User = new mongoose.model("user", userSchema);
module.exports = User;
