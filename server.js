const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const {parse, stringify, toJSON, fromJSON} = require('flatted');const axios = require("axios");
const PORT = process.env.PORT || 5000;
dotenv.config();
const app = express();

//middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

//database connection
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});


//GET request
app.get("/incident", (req, res) => {
  (async () => {
    const client = await pool.connect();
    try {
      const data = await client.query("SELECT * FROM incidents WHERE client_id = $1",[req.query.client_id]);
      res.json(data.rows[0]);
    } catch (err) {
      console.log(err.stack);
    } finally {
      client.release();
    }
  })();
});

//POST request
app.post("/incident", (req, res) => {
    (async () => {
        const client = await pool.connect();
        try {
            const {client_id, incident_desc, city, country}=req.body;
            const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${req.body.city},${req.body.country}&APPID=${process.env.API_KEY}`);
            await client.query(
                `INSERT INTO incidents (client_id, incident_desc, city, country, date, weather_report)  
                VALUES ($1, $2,$3,$4,$5,$6)`, [client_id, incident_desc, city, country,new Date(),stringify(weatherResponse.data)]);
                res.send("Successful report");
        } catch (err) {
          console.log(err.stack);
        } finally {
          client.release();
        }
      })();

});
app.listen(PORT, () => {
    console.log(`Running on ${PORT}`);
  });
