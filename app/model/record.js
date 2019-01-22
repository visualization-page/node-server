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
    // 站点名称
    name: {
      type: String,
      default: '',
    },
    // 文件夹名称
    dir_name: {
      type: String,
      required: true
    },
    // 组件列表
    components: {
      type: Array
    },
    template_id: {
      type: Number,
      required: true
    }
  })

  return mongoose.model('Record', RecordSchema)
}
