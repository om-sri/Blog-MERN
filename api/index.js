const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://bompelli1:om140103@cluster0.wv8p9cp.mongodb.net/?retryWrites=true&w=majority');

app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try{
    const userDoc = await User.create({
      username,
      password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});





app.post('/login', async (req,res) => {
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});


app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) {
      console.error(err); // Log the error for debugging purposes
      return res.status(401).json({ error: 'Authentication failed' });
    }
    // Assuming the token verification was successful, you can send the user info
    res.json(info);
  });
});


app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
  const {originalname,path} = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path+'.'+ext;
  fs.renameSync(path, newPath);

  const {token} = req.cookies;
  jwt.verify(token, secret, {}, async (err,info) => {
    if (err) throw err;
    const {title,summary,content} = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover:newPath,
      author:info.id,
    });
    res.json(postDoc);
  });

});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  try {
    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path + '.' + ext;
      fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' }); // Handle JWT verification error
      }

      const { id, title, summary, content } = req.body;

      // Retrieve the existing post document by its ID
      const existingPost = await Post.findById(id);

      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' }); // Handle post not found
      }

      // Update the existing post document
      existingPost.title = title;
      existingPost.summary = summary;
      existingPost.content = content;
      if (newPath) {
        existingPost.cover = newPath;
      }

      // Save the updated post document
      const updatedPost = await existingPost.save();

      res.json(updatedPost);
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.delete('/post/:id', uploadMiddleware.single('file'), async (req, res) => {
  try {
    const { id } = req.params; // Use the id from request parameters

    // Verify the JWT token
    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' }); // Handle JWT verification error
      }
      
      try {
        const existingPost = await Post.findById(id); // Use the id obtained from request parameters

        if (!existingPost) {
          return res.status(404).json({ error: 'Post not found' }); // Handle post not found
        }

        // Delete the post document
        await existingPost.remove();

        // Optionally, you can also delete any associated files
        if (existingPost.cover) {
          const filePath = path.join(__dirname, 'uploads', existingPost.cover);
          fs.unlinkSync(filePath);
        }

        res.json({ message: 'Post deleted successfully' });
      } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});






app.get('/post', async (req,res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1})
      .limit(20)
  );
});

app.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})

app.listen(4000);
//