require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

var app = express();
app.use(cors());

app.use(bodyParser.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.nez44kl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const productCollection = client.db("thugStore").collection("product");
    const productSellCollection = client
      .db("thugStore")
      .collection("productsell");
    app.get("/product", async (req, res) => {
      const document = await productCollection.find({}).toArray();
      res.send(document);
    });
    app.get("/filterproduct", async (req, res) => {
      const filterCat = req.query.category;

      if (filterCat === "All") {
        const document = await productCollection.find({}).toArray();
        res.send(document);
      } else {
        const document = await productCollection
          .find({ category: filterCat })
          .toArray();
        res.send(document);
      }
    });

    app.get("/productDetails", async (req, res) => {
      const { id } = req.query;
      const product = await productCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(product);
    });
    app.post("/payment", async (req, res) => {
      let { amount, id } = req.body;
      try {
        const payment = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          description: "Cart item",
          payment_method: id,
          confirm: true,
        });
        res.json({
          message: "Payment Successful",
          payId: payment.id,
          success: true,
        });
      } catch (error) {
        console.log(error);
        res.json({ message: "Payment Failed", success: false });
      }
    });
    app.post("/addtoDatabase", (req, res) => {
      const { shipmentInfo } = req.body;
      productSellCollection.insertOne(shipmentInfo).then((result) => {
        res.send(result.acknowledged);
      });
    });
    app.get("/productbyUser", async (req, res) => {
      const { email } = req.query;
      const product = await productSellCollection
        .find({ userEmail: email })
        .toArray();
      res.send(product);
    });
    app.get("/findCartById", async (req, res) => {
      const { id } = req.query;
      const product = await productSellCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(product);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", (req, res) => {
  res.send("ThugStore Server ");
});

app.listen(process.env.PORT || 5000);
