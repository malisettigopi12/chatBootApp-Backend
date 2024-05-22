const mongoose = require("mongoose");

const oneToOneMessageSchema = new mongoose.Schema({
     participants:[{
         type: mongoose.Schema.ObjectId,
         ref: "user",
     }],
     messages:[{
         to:{
             type: mongoose.Schema.ObjectId,
             ref: "user",
         },
         from:{
             type: mongoose.Schema.ObjectId,
             ref: "user",
         },
         type:{
             type: String,
             enum: ["Text", "Media", "Document", "Link"],
         },
         created_at:{
             type: Date,
             default: Date.now(),
         },
         text:{
             type: String,
         },
         file:{
             type: String,
         },
     }]
});

const OneToOneMessage = new mongoose.model("OneToOneMessage", oneToOneMessageSchema);

module.exports = OneToOneMessage;