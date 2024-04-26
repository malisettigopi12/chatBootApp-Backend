const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const bcryptjs = require("bcryptjs");
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
                return String(email).toLowerCase().match(/^[a-zA-Z0-9. _%+-]+@[a-zA-Z0-9. -]+\\. [a-zA-Z]{2,}$/);
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

    passwordConfirm : {
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
        type: Number,
    },
    otp_expiry_time: {
        type: Date,
    }

});

userSchema.pre("save", async function (next) {

    // encrypt otp before save it.

    // only run these function if OTP is actually modified.
    if (!this.isModified("otp")) return next();

    // hash the otp with cost of 12(more value more tough encryption (8 - 16));
    this.otp = await bcryptjs.hash(this.otp, 12);

    next();
});

userSchema.pre("save", async function (next) {

    // encrypt password before save it.

    // only run these function if password is actually modified.
    if (!this.isModified("password")) return next();

    // hash the password with cost of 12(more value more tough encryption (8 - 16));
    this.password = await bcryptjs.hash(this.password, 12);

    next();
});

userSchema.pre("save", async function (next) {

    // encrypt passwordConfirm before save it.

    // only run these function if passwordConfirm is actually modified.
    if (!this.isModified("passwordConfirm")) return next();

    // hash the passwordConfirm with cost of 12(more value more tough encryption (8 - 16));
    this.passwordConfirm = await bcryptjs.hash(this.passwordConfirm, 12);

    next();
});


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
    
    this.passwordResetExpires = Date.now() + 10*60*1000;

    return resetToken;
}

userSchema.methods.changedPasswordAfter = function (timeStamp){

     return timeStamp < this.passwordChangedAt;
}

const User = new mongoose.model("user", userSchema);
module.exports = User;