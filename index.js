const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
    optionSuccessStatus:200,
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
}));


console.log(process.env.DB_PASS)


// Mongodb Start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sozmemk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // Mongodb Connect
        const serviceCollection = client.db('carDoctor').collection('services');
        // Bookings
        const bookingCollectnodeion = client.db('carDoctor').collection('bookings')

        // Auth Related Api

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, 'secret', { expiresIn: '1h' })
            res.send(token)
        })

        // Data Setup Start
        app.get("/services", async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {
                projection: { title: 1, price: 1, service_id: 1, description: 1, img: 1 },
            }
            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })
        // Data Setup End


        // Bookings Start

        app.get("/bookings", async (req, res) => {
            console.log(req.query.email);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollectnodeion.find(query).toArray();
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollectnodeion.insertOne(booking);
            res.send(result)
        })
        // Delete
        app.delete("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollectnodeion.deleteOne(query);
            res.send(result);
        })

        // Update 
        app.patch("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateBooking = req.body;
            console.log(updateBooking);
            const updateDoc = {
                $set: {
                    status: updateBooking.status
                },
            };
            const result = await bookingCollectnodeion.updateOne(filter, updateDoc);
            res.send(result);
        })



        // Send a ping to confirm a successful connection

        await client.db("admin").command({ ping: 1 });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
// Mongodb End



app.get("/", (req, res) => {
    res.send('Car Doctor Server Site is Running');
})

app.listen(port, () => {
    console.log(`Car Doctor is Running On Port ${port}`)
})