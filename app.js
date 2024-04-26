const express = require("express");

const morgan = require("morgan");

const routes = require("./routes");

const rateLimit = require("express-rate-limit");

const helmet = require("helmet");

const mongoSanitize = require("express-mongo-sanitize");

const bodyParser = require("body-parser");

const xss = require("xss");

const cors = require("cors");

// all above packages are from node;
const app = express();

app.use(express.urlencoded({
    extended: true,
}));

app.use(mongoSanitize());

// app.use(xss());

app.use(express.json({ limit : "10kb"}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(helmet());

if(process.env.NODE_ENV === "development"){
    app.use(morgan("dev"));
}

const limited = rateLimit({
    max: 3000,
    windowMs: 60 * 60 * 1000, // In one hour
    message: "Too many requests from this IP, Please try again in an hour",
});

app.use("/tawk", limited);


app.use(cors({
    origin: "*",
    methods: ["GET","PATCH","POST","DELETE","PUT"],
    crendentials: true,
}));


app.use(routes);
module.exports = app;