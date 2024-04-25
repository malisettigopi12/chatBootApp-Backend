const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        require: [true, "first name is required"],
    },
    lastName: {
        type: String,
        require: [true, "last name is required"],
    },
    avatar:{
        type: String,
    },
    email:{
        type: String,
        require: [true, "email is required"],
        validate: {
            validator: function (email){
                return String(email).toLowerCase().match(/^[a-zA-Z0-9. _%+-]+@[a-zA-Z0-9. -]+\\. [a-zA-Z]{2,}$/);
            },
            message: (props) => `Email (${props.value})is invalid!`,
        },
    },
    password:{
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

});

userSchema.methods.correctPassword = async function(
    candidatePassword, // 123456
    userPassword // shddjucbkn39oldcml
){
    return await bcrypt.compare(candidatePassword, userPassword);
}
const User = new mongoose.model("user",userSchema);
module.exports = User;