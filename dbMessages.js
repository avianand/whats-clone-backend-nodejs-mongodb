import mongoose from "mongoose";

const whatsappschema = mongoose.Schema({
  roomId: String,
  roomName: String,
  roomOwner: String,
  _created_at: Date,
  _last_updated_at: Date,
  users: [String],
  messages: [
    {
      id: String,
      message: String,
      sender: {
        name: String,
        email: String,
      },
      timestamp: String,
      deleted: Boolean,
    },
  ],
});

export default mongoose.model("messagecontent", whatsappschema);
