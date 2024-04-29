const sgMail = require("@sendgrid/mail");

// const dotenv = require("dotenv");

// dotenv.config({path: "../config.env"});

console.log(process.env.SG_KEY);
//sgMail.setApiKey(process.env.SG_KEY); // TODO IN PROCESS.ENV FILE

const sendSGMail = async({
      recipient,
      to,
      sender,
      subject,
      html,
      text,
      attachments,
}) => {
    try{
      
        const from = "gopamalisetti@gmail.com";

        const msg = {
            to : to,
            from: from,
            subject: subject,
            html: html,
            attachments,
        }

        
        console.log(msg);

        return sgMail.send(msg);

    } catch(error){
      console.log(error);
    }
};

exports.sendEmail = async (srgs) => {
    if(process.env.NODE_ENV === "development"){
        return Promise.resolve();
    }else{
        return sendSGMail(args);
    }
}