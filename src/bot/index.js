'use strict';

const requireIndex = require('requireindex');

module.exports = (app, db, io, comm, config, client, wclient) => {
  const messagesSent = []; // List of last 20 message send times
  const needToSend = []; // Messages that can't be sent until we've waited long enough

  function chat(channel, msg) {
    if (Date.now() - messagesSent[0] < 30 * 1000 && messagesSent.length >= 20) {
      needToSend.push({ channel, msg });
      return;
    } else if (messagesSent.length >= 20) {
      messagesSent.shift();
    }

    messagesSent.push(Date.now());
    client.say(channel, msg);
  }

  function sendAllNeededMessages() {
    while (needToSend.length > 0) {
      if (Date.now() - messagesSent[0] < 30 * 1000) {
        return;
      }

      const msg = needToSend.shift();
      chat(msg.channel, msg.msg);
    }
  }

  setInterval(sendAllNeededMessages, 1000); // TODO: Maybe fix? Cleaner way of doing this?

  function whisper(user, msg) {
    const userName = user.username || user;
    wclient.whisper(userName, msg);
  }

  client.on('connected', () => {
    console.log('Connected to channels');
  });

  wclient.on('connected', () => {
    console.log('Connected to whisper server');
  });

  client.on('chat', (channel, user, message) => {
    const messageItem = new db.message({
      user: user.username,
      message
    });

    messageItem.save((err) => {
      if (err) {
        console.error('[ERROR SAVING MESSAGE]', err);
      }
    });
  });

  const commandFiles = requireIndex(`${__dirname}/commands`);
  Object.keys(commandFiles).forEach(cmdFile => {
    console.log(`Loading Command File ${cmdFile}`);
    commandFiles[cmdFile](client, wclient, chat, whisper, comm, config, db);
  });

  comm.clearPolls = (cb) => {
    db.poll.find({ end: null }, (err, polls) => {
      polls.forEach(poll => {
        poll.end = Date.now();
        poll.save((err) => {
          if (err) {
            console.error('[POLL CHECK ERR]', err);
          }
        });
      });

      if (cb) {
        cb();
      }
    });
  };
};
