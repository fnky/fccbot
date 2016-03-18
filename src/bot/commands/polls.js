module.exports = (client, wclient, chat, whisper, comm, config, db) => {
  wclient.on('whisper', (user, message) => {
    const username = user.username;

    if (message.match(/^vote/)) {
      db.poll.find({ end: null }, (err, polls) => {
        const poll = polls[0];

        if (!poll) {
          whisper(username, 'There is no poll currently running.');
          return;
        }

        db.pollVote.find({ poll: poll._id, user: username }, (voteError, votes) => {
          let vote = votes[0];
          const match = message.match(/^vote (\d)$/);

          if (!match) {
            whisper(username, 'To vote, use /w fccbot vote # (e.g. vote 2)');
            return;
          }

          const num = parseInt(match[1], 10) - 1;
          if (num < 0 || num >= poll.options.length) {
            const itemsLength = poll.options.length;
            wclient.whisper(username, `You can only vote between items 1-${itemsLength}`);
            return;
          }

          if (!vote) {
            const pollOption = poll.options[num];
            whisper(username, `You voted for "${pollOption}"`);
            vote = new db.pollVote({
              poll: poll._id,
              user: username,
              vote: num
            });
          } else {
            const pollOption = poll.options[num];
            whisper(username, `You changed your vote to "${pollOption}"`);
            vote.vote = num;
          }

          vote.save(saveErr => {
            if (saveErr) {
              console.log('[POLLVOTE SAVE ERR]', saveErr);
            }
          });
        });
      });
    }
  });

  comm.on('newpoll', () => {
    const channel = config.get('twitch.channels')[0];

    db.poll.find({ end: null }, (err, polls) => {
      const poll = polls[0];

      const pollTitle = poll.title;
      const suffix = '.?!'.indexOf(pollTitle[pollTitle.length - 1]) ? '' : '.';

      chat(channel, `New Poll: ${pollTitle}${suffix} – Vote by typing: /w fccbot vote #`);

      poll.options.forEach((option, index) => {
        chat(channel, `${index + 1}. ${option}`);
      });
    });
  });

  comm.on('endpoll', () => {
    const channel = config.get('twitch.channels')[0];

    db.poll.find({ end: null }, (err, polls) => {
      const poll = polls[0];

      if (!poll) {
        return;
      }

      db.pollVote.find({ poll: poll._id }, (voteErr, votes) => {
        if (votes.length === 0) {
          chat(channel, `No one voted on: ${poll.title}`);
          return;
        }

        const totals = poll.options.map((i) => ({ name: i, total: 0 }));

        votes.forEach(vote => {
          totals[vote.vote].total++;
        });

        chat(channel, `Results for: ${poll.title} (${votes.length} votes)`);

        const sortedTotal = totals.sort((a, b) => a.total < b.total);
        const places = ['1st', '2nd', '3rd'];
        sortedTotal.forEach((total, i) => {
          const place = i < 3 ? places[i] : `${(i + 1)}th`;
          const average = Math.round(sortedTotal.total / votes.length * 100);

          chat(channel, `${place}: ${sortedTotal.name} (${sortedTotal.total} votes, ${average})`);
        });
      });
    });
  });

  client.on('chat', (channel, user, message, self) => {
    if (self) {
      return;
    }

    if (message.match(/^.?vote /)) {
      chat(channel, `@${user.username}, vote using /w fccbot vote #`);
    } else if (message.match(/^!endpoll/) && user['user-type'] === 'mod') {
      comm.emit('endpoll');
    }
  });
};
