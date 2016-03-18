module.exports = (mongoose) => {
  const Schema = mongoose.Schema;

  const pollVoteSchema = new Schema({
    poll: String,
    user: String,
    vote: Number
  });

  return mongoose.model('pollVote', pollVoteSchema);
};
