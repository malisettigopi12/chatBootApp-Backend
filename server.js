
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
    console.log(socket);
    const user_id = socket.handshake.query("user_id");

    const socket_id = socket.id;

    console.log(`User connected ${socket_id}`);

    if(user_id){
        await User.findByIdAndUpdate(user_id, {socket_id})
    }
    
    // We can write our socket event listners here ....

    socket.on("friend_request", async (data)=>{

        console.log(data.to);

        const to = await User.findById(data.to);
        
        // TODO => create a friend request
        


        io.to(to.socket_id).emit("new_friend_request", {
              // 
        });
    })
})

process.on("unhandledRejection",(err)=>{
    console.log(err);
    server.close(()=>{
        process.exit(1);
    });
})