const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const axios = require("axios");

require("dotenv").config();
const mongoose =require("mongoose");
const initData =require("./data.js");
const Listing = require("../models/listing.js");
const MONGO_URL = process.env.ATLASDB_URL;

main().then(()=>{
    console.log("connected to DB");
    initDB();
}).catch((err)=>{
    console.log(err);
});

async function main() { 
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    //await Listing.deleteMany({});
    
    for (let obj of initData.data) {
        const existingListing = await Listing.findOne({ title: obj.title });

        if (existingListing) {
            console.log(`Skipping ${obj.title} (already exists)`);
            continue; // as we are inserting sample data from data.js file which doesn't have geometry field , so we use nominatim api for getting the coordinates for each listing based on the location of the listing , add that geometry field then saving the listing in the MongoDB atlas DB.
        }
        try {
            // Get coordinates from Nominatim
            const response = await axios.get(
                "https://nominatim.openstreetmap.org/search",
                {
                    params: {
                        q: `${obj.location}, ${obj.country}`,
                        format: "jsonv2",
                        limit: 1,
                    },
                    headers: {
                        "User-Agent": "WanderLust/1.0",
                    },
                }
            );

            if (response.data.length === 0) {
                console.log(`Skipping ${obj.location} - Coordinates not found`);
                continue;
            }

            const longitude = parseFloat(response.data[0].lon);
            const latitude = parseFloat(response.data[0].lat);

            const listing = new Listing({
                ...obj,
                owner: "6a54eb63a9ec0acea697aeec",
                geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                },
            });

            await listing.save();
            //await new Promise(resolve => setTimeout(resolve, 5000));

            console.log(`Added: ${obj.title}`);
        } catch (err) {
            console.log(`Error adding ${obj.title}`);
            console.log(err.message);
        }
    }

    console.log("Sample data initialized successfully!");
};

//initDB();