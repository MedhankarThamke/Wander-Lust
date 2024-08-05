const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ejs = require("ejs");
const MONGO_URL = "mongodb://127.0.0.1:27017/wander-lust";
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate); //this is for ejs mate

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  // console.log(result);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

main()
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(`${MONGO_URL}`);
}

app.get("/", (req, res) => {
  res.send("root route is working");
});

//index route
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListing = await Listing.find({});
    res.render("listings/index.ejs", { allListing });
  })
);

// add new listing
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// show route

app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
  })
);

// listing route for adding Create
app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res, next) => {
    // let { title, description, image, location } = req.body;
    // this is one way or we can change the name in ejs file as listings[----]

    const newListing = new Listing(req.body.listing);

    await newListing.save();
    res.redirect("/listings");
  })
);

// eidt route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  })
);

// update
app.put(
  "/listings/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing }); //this is the destructing of lsiting object
    res.redirect(`/listings/${id}`);
  })
);

// delete
app.delete(
  "/listing/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
  })
);

// testing
// app.get("/testing", async (req, res) => {
//   let sample = new Listing({
//     title: "Rajgruh",
//     description: "The most prestigious",
//     price: 10000,
//     location: "delhi",
//     country: "India",
//   });
//   await sample.save();
//   console.log("sample was saved!");
//   res.send("successful");
// });
//error handling
app.all("*", (req, res, next) => {
  next(new ExpressError(401, "page not found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  // res.status(statusCode).send(message);
  res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
  console.log("listening on port 8080");
});
