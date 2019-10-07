const path = require('path');
const jsdom = require('jsdom');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const Datauri = require('datauri');

const datauri = new Datauri();
const { JSDOM } = jsdom;

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/db', async (req, res) => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT * FROM scores');
    res.status(200).json(result.rows)
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

app.update('/db', async (req, res) => {
  try {
    const { blue, red } = request.body;
    const client = await pool.connect();
    const result = await client.query('UPDATE scores SET score = ? WHERE team = ?', [blue, 'blue']);
    const result2 = await client.query('UPDATE scores SET score = ? WHERE team = ?', [red, 'red']);
    res.status(200).json(result.rows);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

function setupAuthoritativePhaser() {
  JSDOM.fromFile(path.join(__dirname, 'authoritative_server/index.html'), {
    // To run the scripts in the html file
    runScripts: "dangerously",
    // Also load supported external resources
    resources: "usable",
    // So requestAnimatinFrame events fire
    pretendToBeVisual: true
  }).then((dom) => {
    dom.window.URL.createObjectURL = (blob) => {
      if (blob){
        return datauri.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content;
      }
    };
    dom.window.URL.revokeObjectURL = (objectURL) => {};
    dom.window.gameLoaded = () => {
      let port = process.env.PORT;
      if (port == null || port == "") {
        port = 8082;
      }
      server.listen(port, function () {
        console.log(`Listening on ${server.address().port}`);
      });
    };
    dom.window.io = io;
  }).catch((error) => {
    console.log(error.message);
  });
}

setupAuthoritativePhaser();