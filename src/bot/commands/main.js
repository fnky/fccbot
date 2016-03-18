'use strict';

const request = require('request');

module.exports = (client, wclient, chat, whisper, comm, config, db) => {

  client.on('chat', (channel, user, message, self) => {
    if (self) return;

    if (message.match(/^!random \d+-\d+/i)) {
      const match = message.match(/^!random (\d+)-(\d+)/i);
      const first = parseInt(match[1], 10);
      const second = parseInt(match[1], 10);

      const high = Math.max(first, second);
      const low = Math.min(first, second);

      const randomMessage = Math.floor(Math.random() * (high - low + 1) + low);
      chat(channel, `${randomMessage}!`);
    } else if (message.match(/^!clear$/i) && user['user-type'] === 'mod') {
      client.clear(channel);
    } else if (message.match(/^!uptime$/i)) {
      const firstChannel = config.get('twitch.channels')[0];
      request(`https://api.twitch.tv/kraken/streams/${firstChannel}`, (err, http, body) => {
        if (err) {
          chat(channel, 'Error getting uptime!');
          return;
        }

        const data = JSON.parse(body);
        if (!data.stream || !data.stream.created_at) {
          chat(channel, 'Error parsing uptime!');
          return;
        }

        // @TODO: Use something like `moment`
        const createdAt = new Date(data.stream.created_at);
        const diff = Math.floor((Date.now() - (createdAt).getTime()) / 1000);
        const seconds = diff % 60;
        const minutes = Math.floor(diff / 60) % 60;
        const hours = Math.floor(diff / 3600);

        const hoursStr = hours ? `${hours}h ` : '';
        const minutesStr = minutes ? `${minutes}m ` : '';
        const secondsStr = seconds ? `${seconds}s ` : '';
        const timeStr = `${hoursStr}${minutesStr}${secondsStr}`;

        const str = `The stream has been live for ${timeStr}`;
        chat(channel, str);
      });
    }
  });
};
