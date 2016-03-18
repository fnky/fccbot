const express = require('express');
const tmi = require('tmi.js');
const mongoose = require('mongoose');
const path = require('path');
const config = require('config');
const EventEmitter = require('events').EventEmitter;

const bot = require('./bot');
const dashboard = require('./dashboard/server');

const MongoDB = mongoose.connect('mongodb://localhost:27017').connection;

MongoDB.on('error', (err) => {
  console.log(`Database error: ${err.message}`);
});

MongoDB.once('open', () => {
  console.log('Connected to database');
});

const app = express(MongoDB);

app.use(express.static(path.join(__dirname, 'dashboard/views')));
app.use(express.static(path.join(__dirname, 'dashboard/static')));

const db = {
  message: require('../schemas/message')(mongoose),
  poll: require('../schemas/poll')(mongoose),
  pollVote: require('../schemas/pollVote')(mongoose)
};

const port = process.env.PORT || (config.get('testPort') ? 3000 : 80);
const server = app.listen(port, () => {
  console.log(`Server live on port ${port}`);
});
const io = require('socket.io').listen(server);

const options = {
  options: {
    debug: true
  },
  connection: {
    cluster: 'chat',
    reconnect: true
  },
  identity: {
    username: config.get('twitch.username'),
    password: config.get('twitch.oauth').trim()
  },
  channels: config.get('twitch.channels').map((channel) => `#${channel}`)
};

const whisperoptions = {
  options: options.options,
  connection: {
    cluster: 'group',
    reconnect: true
  },
  identity: options.identity
};

const client = new tmi.client(options);
const whisperclient = new tmi.client(whisperoptions);

client.connect();
whisperclient.connect();

const communicator = Object.create(EventEmitter.prototype);

bot(app, db, io, communicator, config, client, whisperclient);
dashboard(app, db, io, communicator, config);
