const sgMail = require("@sendgrid/mail");

const dotenv = require("dotenv");

dotenv.config({path: "../config.env"});

sgMail.setApiKey(process.env.SG_KEY); // TODO IN PROCESS.ENV FILE

const sendSGMail = async({
      recipient,
      sender,
      subject,
      html,
      text,
      attachments,
}) => {
    try{
      
        const from = sender || "gopamalisetti@gmail.com";

        const msg = {
            to : recipient,
            deom: from,
            subject,
            html: html,
            text: text,
            attachments,
        }


        return sgMail.send(msg);

    } catch(error){
      console.log(error);
    }
};

exports.sendEmail = async (srgs) => {
    if(process.env.NODE_ENV === "development"){
        return new Promise.resolve();
    }else{
        return sendSGMail(args);
    }
}