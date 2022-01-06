import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, "/build")));

app.use(bodyParser.json());

const withDB = async (operations) => {
  const client = await MongoClient.connect("mongodb://localhost:27017", {
    useNewURLParser: true,
  });
  const db = client.db("local");

  await operations(db);

  client.close();
};

app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("my-blog")
      .findOne({ name: articleName });

    res.status(200).json(articleInfo);
  });
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("my-blog")
      .findOne({ name: articleName });

    await db.collection("my-blog").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );
    const updatedArticleInfo = await db
      .collection("my-blog")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  });
});

app.post("/api/articles/:name/add-comment", async (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db
      .collection("my-blog")
      .findOne({ name: articleName });

    await db.collection("my-blog").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );

    const updatedArticleInfo = await db
      .collection("my-blog")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => console.log("Listening on port 8000"));
