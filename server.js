
const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({path: "./config.env"});

const {Server} = require("socket.io");

process.on("uncaughtException",(err)=>{
    console.log(err);
    process.exit(1);
});

const http = require("http");
const User = require("./models/user");
const FriendRequest = require("./models/friendRequest");

const DB = process.env.DBURI.replace("<PASSWORD>",process.env.DBPASSWORD);

mongoose.connect(DB,{
    // useNewUrlParser: true,
    // // useCreateIndex: true,
    // // useFindAndModify: false,
    // useUnifiedTopology: true,  
}).then((con)=>{
    console.log("DB connection is successful")
}).catch((err)=>{
    console.log(err);
});

const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin: "http://localhost:8000",
        methods: ["GET","POST"],
    }
});

const port = 8000;
server.listen(port, () => {
    console.log(`app running on port ${port}`);
});

io.on("connection", async (socket)=>{

    console.log(JSON.stringify(socket.handshake.query));
    console.log(socket);

    const user_id = socket.handshake.query("user_id");

    const socket_id = socket.id;

    console.log(`User connected ${socket_id}`);

    if(Boolean(user_id)){
        await User.findByIdAndUpdate(user_id, {socket_id})
    }
    
    // We can write our socket event listners here ....

    socket.on("friend_request", async (data)=>{

        console.log(data.to);
        
        // dta = {to, from}
        const to_user = await User.findById(data.to).select("socket_id");
        const from_user = await User.findById(data.from).select("socket_id");
        
        await FriendRequest.create({
            sender: data.from,
            recipient: data.to,
        })
        
         // TODO => create a friend request

        io.to(to_user.socket_id).emit("new_friend_request", {
              //
              message: "New friend request recieved",
        });

        io.to(from_user.socket_id).emit("request_sent", {
            //
            message: " request sent successfully",
        });
        
        socket.on("accept_request", async (data) => {

            console.log(data);

            const request_doc = await FriendRequest.findById(data.request_id);

            console.log(request_doc);

            // request_id


            const sender = await User.findById(request_doc.sender);
            const receiver = await User.findById(request_doc.recipient);

            sender.friends.push(request_doc.recipient);
            receiver.friends.push(request_doc.sender);

            await receiver.save({new: true, validateModifiedOnly: true});
            await sender.save({new: true, validateModifiedOnly: true});

            await FriendRequest.findByIdAndDelete(data.request_id);

            io.to(sender.socket_id).emit("request_accepted",{
                message: "Friend request Accepted",
            });

            io.to(receiver.socket_id).emit("request_accepted",{
                message: "Friend request Accepted",
            });
        })
      
        socket.on("end", function (){
            console.log("closing connection");
            socket.disconnect(0);
        })
    })
})

process.on("unhandledRejection",(err)=>{
    console.log(err);
    server.close(()=>{
        process.exit(1);
    });
})