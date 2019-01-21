module.exports = app => {
  const { mongoose } = app
  const { Schema } = mongoose

  const ComponentSchema = new Schema({
    id: {
      type: Number,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    files: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      default: 'https://avatars3.githubusercontent.com/u/38666040',
    }
  })

  return mongoose.model('Component', ComponentSchema)
}
