const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);


if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express=require("express");
const app= express();
const mongoose =require("mongoose");
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

const path =require("path");
app.use(express.urlencoded({extended:true}));
app.set("view engine" , "ejs");
app.set("views", path.join(__dirname , "views"));
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
const ExpressError = require("./utils/ExpressError.js");

const listingRouter =require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy =require("passport-local");
const User =require("./models/user.js");

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main() { 
    await mongoose.connect(dbUrl);
}
console.log(MongoStore);
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto : {
        secret: process.env.SECRET,
    },
    touchAfter : 24*3600,
});

store.on("error", ()=>{
    console.log("ERROR in MONGO SESSION STORE" , err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000 , //milliseconds for 1 week
        maxAge: 7*24*60*60*1000,
        httpOnly: true
    }
};

//Home or Root 
// app.get("/" , (req,res)=>{
//     res.send("hi, I'm root");
// });

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize()); //passport gets initialized for every request
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());// to store user data into session so that the user wont need to sign in again for the different browser tab
passport.deserializeUser(User.deserializeUser());//to unstore the data from the session


app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser =req.user;
    next();
});

//DEMO user
// app.get("/demouser", async (req,res)=>{
//     let fakeUser = new User({
//         email: "abc@gmail.com",
//         username: "hello-world"
//     });

//     let registeredUser = await User.register(fakeUser, "abc123"); //register() is a static method of passport which stores the username and password for our user in the DB and it checks whether the username is unique or not
//     res.send(registeredUser);

// });

app.use("/listings" , listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/" , userRouter);


//if the request comes at the path other than the above routes , then page not found error
app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

//error handler 
app.use((err,req,res,next)=>{
    let {statusCode = 500 , message = "something went wrong!"} =err;
    //res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs" , {message});
});

app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});
