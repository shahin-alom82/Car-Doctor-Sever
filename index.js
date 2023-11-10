const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: [
        'http://localhost:5173',
     
    ],
   
    credentials: true,
}));

// Middleware
const logger = async(req, res, next) => {
    console.log('log info', req.method, req.url);
    next()
}

// Verify token

const verifyToken = async(req, res, next) => {
    const token = req?.cookies?.token;
    console.log('middleware token', token)
    if(!token){
        return res.status(401).send({message: 'not authorized'})
    }
    jwt.verify(token, process.env.ACCSESS_TOKEN_SECRET, (err, decoded) => {
        // error
        if(err){
            console.log(err)
            return res.status(401).send({message: 'unauthorized access'})
        }
        // if Token Is Valid the it world be decoded
        console.log('value in the token', decoded)
        req.user = decoded;
        next()
    })
} 


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
        const bookingCollection = client.db('carDoctor').collection('bookings')

        // Auth Related Api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCSESS_TOKEN_SECRET, { expiresIn: '1h' })
            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false,
                // sameSite: 'none'
            })
            .send({success: true})
        })


        // logOut
        app.post('/signup', async(req, res) => {
            const user = req.body;
            console.log('sign out', user)
            res.clearCookie('token', {maxAge: 0}).send({success: true})
        })


        // Data Setup Start
        app.get("/services", logger, async (req, res) => {
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
            const result = await serviceCollection.findOnone(query, options);
            res.send(result);
        })
        // Data Setup End


        // Bookings Start
        app.get("/bookings", logger, verifyToken, async(req, res) => {
            console.log(req.query.email);
            console.log('token ownar info', req.user)
            if(req.user.email !== req.query.email){
                return res.status(403).send({message: 'forbidden access'})
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })
        // Delete
        app.delete("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
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
            const result = await bookingCollection.updateOne(filter, updateDoc);
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