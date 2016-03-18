module.exports = (mongoose) => {
  const Schema = mongoose.Schema;

  const messageSchema = new Schema({
    user: String,
    date: { type: Date, default: Date.now() },
    message: { type: String, default: '' }
  });

  return mongoose.model('message', messageSchema);
};
