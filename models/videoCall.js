const mongoose = require("mongoose");

const videoCallSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "user",
    },
  ],
  from: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
  },
  to: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
  },
  verdict: {
    type: String,
    enum: ["Accepted", "Denied", "Missed", "Busy"],
  },
  status: {
    type: String,
    enum: ["Ongoing", "Ended"],
  },
  startedAt: {
    type: Date,
    default: Date.now(),
  },
  endedAt: {
    type: Date,
  },
});

const VideoCall = new mongoose.model("VideoCall", videoCallSchema);
module.exports = VideoCall;