module.exports = app => {
  const { mongoose } = app
  const { Schema } = mongoose

  const RecordSchema = new Schema({
    id: {
      type: Number,
      unique: true,
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
    // 文件夹名称
    dir_name: {
      type: String,
      required: true
    },
    // 站点说明
    description: {
      type: String,
      default: '',
    },
    // 站点标题
    title: {
      type: String,
      default: '',
    },
    // 站点相对地址
    url: {
      type: String,
      default: '',
    },
    template_id: {
      type: Number,
      required: true
    }
  })

  return mongoose.model('Record', RecordSchema)
}
