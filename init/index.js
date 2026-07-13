const mongoose =require("mongoose");
const initData =require("./data.js");
const Listing = require("../models/listing.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main() { 
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({...obj , owner : "6a4b4551a80ff400fa64d7f5"}))
    await Listing.insertMany(initData.data);
    console.log("sample Data was initialized in DB");
};

initDB();