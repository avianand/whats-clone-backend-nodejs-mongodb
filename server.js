import express from "express";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import Cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "",
  key: "",
  secret: "",
  cluster: "",
  useTLS: true,
});

//middleware
app.use(express.json());
app.use(Cors());

//db config
const connect_url =
  "mongodb+srv://admin:<password>@cluster0.xkp65.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(connect_url, {
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", async () => {
  console.log("db is connected");

  const msgCollection = db.collection("messagecontents");

  const changeStream = msgCollection.watch();
  changeStream.on("change", async (change) => {
    if (change.operationType === "update") {
      const messagesinDb = await Messages.find({
        _id: ObjectId(change.documentKey._id),
      }).exec();
      const tempKey = "messages." + (messagesinDb[0].messages.length - 1);
      // console.log({ tempKey });
      // console.log(change.updateDescription.updatedFields[tempKey]);
      console.log(change);
      let message = change.updateDescription.updatedFields[tempKey];
      console.log({ message });
      pusher.trigger("messages", "updated", {
        message: message,
      });
    } else if (change.operationType === "insert") {
      pusher.trigger("messages", "inserted", {
        newRoom: change.fullDocument,
      });
    } else {
      console.log("some error with pusher");
    }
  });
});

//api routes
app.get("/", (request, response) => response.status(200).send("hello"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/room/new", (req, res) => {
  const room = req.body;
  Messages.create(room, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", async (req, res) => {
  const doc = await Messages.findOneAndUpdate(
    { roomId: req.body.roomId },
    {
      $push: {
        messages: req.body.messages,
      },
    }
  );
  console.log({ doc });
});

//listener
app.listen(port, () => console.log(`listening pn localhost:${port}`));
