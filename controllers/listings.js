const Listing = require("../models/listing");
const axios = require("axios");

module.exports.index =async (req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
};   

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListings = async (req,res)=>{
    let { id } =req.params;
    const listing = await Listing.findById(id).populate({path : "reviews" , populate: { path : "author" }}).populate("owner");
    if(!listing){
        req.flash("error","The listing you are looking for is no longer available!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", {listing});
};

// module.exports.createListing = async (req,res,next)=>{
//         let url= req.file.path;
//         let filename = req.file.filename;
//         const newListing = new Listing(req.body.listing);
//         newListing.owner = req.user._id;
//         newListing.image ={url,filename};
//         await newListing.save();
//         req.flash("success","New Listing Created!");
//         res.redirect("/listings");  
// };

module.exports.createListing = async (req, res, next) => {

    // Get coordinates from Nominatim
    const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
            params: {
            q: `${req.body.listing.location}, ${req.body.listing.country}`,
            format: "jsonv2",
            limit: 1,
},
            headers: {
                "User-Agent": "WanderLust/1.0"
            }
        }
    );

    if (response.data.length === 0) {
        req.flash("error", "Invalid location!");
        return res.redirect("/listings/new");
    }

    let longitude = parseFloat(response.data[0].lon);
    let latitude = parseFloat(response.data[0].lat);

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    newListing.image = { url, filename };

    // Store coordinates in GeoJSON format
    newListing.geometry = {
        type: "Point",
        coordinates: [longitude, latitude],
    };

    await newListing.save();

    req.flash("success", "New Listing Created!");

    res.redirect("/listings");
};

module.exports.renderEditForm = async (req,res)=>{
    let { id } =req.params;
    const listing = await Listing.findById(id);
     if(!listing){
        req.flash("error","The listing you are looking for is no longer available!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", {listing, originalImageUrl});
};

// module.exports.updateListing = async (req,res)=>{
//     let { id } =req.params;
//     let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});

//     if(typeof req.file !== "undefined"){
//     let url= req.file.path;
//     let filename = req.file.filename;
//     listing.image = {url,filename};
//     await listing.save();
//     }
//     req.flash("success","Listing Updated!");
//     res.redirect(`/listings/${id}`);
// };

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findById(id);

    // Update basic listing details
    Object.assign(listing, req.body.listing);

    // Geocode the updated location
    const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
            params: {
                q: `${listing.location}, ${listing.country}`,
                format: "jsonv2",
                limit: 1,
            },
            headers: {
                "User-Agent": "WanderLust/1.0",
            },
        }
    );

    if (response.data.length > 0) {
        listing.geometry = {
            type: "Point",
            coordinates: [
                parseFloat(response.data[0].lon),
                parseFloat(response.data[0].lat),
            ],
        };
    }

    // Update image if a new one was uploaded
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");

    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req,res)=>{
    let { id } =req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};