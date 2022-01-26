const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const moment = require("moment");
require("dotenv").config();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect(
    process.env.MONGO_URI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (error) => {
        console.log(error);
    }
);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    exercises: [{ description: String, duration: Number, date: Date }],
});

let UserModel = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
    const { username } = req.body;
    let newUser = new UserModel({ username });
    newUser.save().then((result) => {
        res.json({ username: result.username, _id: result._id });
    });
});
app.get("/api/users", (req, res) => {
    UserModel.find({}, (err, users) => {
        if (!err) {
            res.send(users);
        } else {
            return;
        }
    });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
    const id = req.params._id;
    const date = req.body.date;

    UserModel.findById(id, (err, data) => {
        if (!data) {
            res.json({ error: "Unknown userId" });
        } else {
            if (!date) {
                data.exercises.push({
                    date: new Date().toDateString(),
                    duration: +req.body.duration,
                    description: req.body.description,
                });
                data.save(data.exercises);
                res.json({
                    _id: id,
                    username: data.username,
                    date: new Date().toDateString(),
                    duration: +req.body.duration,
                    description: req.body.description,
                });
            } else {
                data.exercises.push({
                    date: new Date(req.body.date).toDateString(),
                    duration: +req.body.duration,
                    description: req.body.description,
                });
                data.save(data.exercises);
                res.json({
                    _id: id,
                    username: data.username,
                    date: new Date(req.body.date).toDateString(),
                    duration: +req.body.duration,
                    description: req.body.description,
                });
            }
        }
    });
});

// Get exercises logs for a specific username
app.get("/api/users/:_id/logs", (req, res) => {
    const id = req.params._id;
    let { from, to, limit } = req.query;
    from = moment(from, "YYYY-MM-DD").isValid()
        ? moment(from, "YYYY-MM-DD")
        : 0;
    to = moment(to, "YYYY-MM-DD").isValid()
        ? moment(to, "YYYY-MM-DD")
        : moment().add(1000000000000);

    UserModel.findById(id, (err, data) => {
        if (!data) {
            res.json({ error: "Unknown userId" });
        } else {
            let filtered = data.exercises
                .filter((currentElement) => {
                    return moment(currentElement.date).isBetween(from, to);
                })
                .map((element) => ({
                    duration: element.duration,
                    description: element.description,
                    date: element.date.toDateString(),
                }));
            res.json({
                _id: data._id,
                username: data.username,
                count: data.exercises.length,
                log: filtered.slice(0, limit),
            });
        }
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
