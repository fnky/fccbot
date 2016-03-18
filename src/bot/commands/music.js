const request = require('request');
const Youtube = require('youtube-api');

function parseYoutubeLink(str) {
  const match = str.match(/youtube\.com\/watch\?v=(.*?)(&|$| )/);
  return match && match[1];
}

function addSongToList(songId) {
  // @TODO: Make this connect to streamer's frontend
}

module.exports = (client, wclient, chat, whisper, comm, config, db) => {

  const auth = Youtube.authenticate({
    type: 'key',
    key: config.get('google.key')
  });

  client.on('chat', (channel, user, message, self) => {
    if (self) return;

    if (message.match(/^!songrequest .+/i) || message.match(/^!sr .+/i)) {
      const match = message.match(/^!songrequest (.+)/i) || message.match(/^!sr (.+)/i);
      const youtubeId = parseYoutubeLink(match[1]);
      if (!youtubeId && false) {
        chat(channel, 'That\'s an invalid youtube link!');
      } else {
        Youtube.videos.list({
          part: 'snippet',
          id: youtubeId
        }, (err, data) => {
          if (err) {
            console.log('[Get song ERROR]', err);
            return;
          }

          if (data.items.length === 0) {
            chat(channel, 'Can\'t find that video!');
          } else if (data.items[0].snippet.categoryId !== '10') {
            chat(channel, 'The video must have a category of "Music"');
          } else {
            const songTitle = data.items[0].snippet.title;
            chat(channel, `Adding "${songTitle}" to the song list`);
            addSongToList(youtubeId);
          }
        });
      }
    }
  });
};
