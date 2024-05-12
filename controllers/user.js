const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const filterObj = require("../utils/filterObj");

exports.updateMe = async (req,res, next) => {

    const {user} = req;

    const filteredBody = filterObj(req.body, "firstName", "lastName", "about", "avatar")

    const update_user = await User.findByIdAndUpdate(user._id,filteredBody,{
        new : true,
        validateModifyOnly : true,
    } );

    res.status(200).json({
        status: "success",
        data: update_user,
        message: "Profile Updated suceessfully",
    })
};

exports.getUsers = async (req, res, next) => {
    const all_users = await User.find({
        verified: true,
    }).select("firstName lastName _id");

    const this_user = req.user;

    const remaining_users = all_users.filter((user)=> !all_users.friends.includes(user._id) &&
                            user._id.toString() !== req.user._id.toString());

    res.status(200).json({
        status: "success",
        message: "Users found successfully",
    })                        
}

exports.getRequests = async (req,res,next) => {
    const requests = await FriendRequest.find({recipient: req.user._id}).populate("sender", "_id firstName lastName");
    
    res.status(200).json({
        status: "success",
        data: requests,
        message: "Friends requests found successfully!",
    })
}

exports.getFriends = async (req, res, next) => {
    const this_friends = await User.findById(req.user._id).populate("friends", "_id firstName lastName");

    res.status(200).json({
        status: "success",
        data: this_friends.friends,
        message: "Friends found successfully!",
    })
}