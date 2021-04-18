var express = require('express');
var router = express.Router();
var db = require('../db');
const {registerValidation, loginValidation} = require('../validation');
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


router.use(express.json()); // for parsing application/json

/* GET users listing. */
router.get('/', function(req, res, next) {
  var sql = "SELECT * FROM users";
  db.query(sql, function(err, rows, fields) {
    if (err) {
      res.status(500).send({ error: 'Something failed!' })
    }
    res.json(rows)
  })
});


/* POST method for user register. */
router.post('/register', async (req,res)=> {

  const {error} = registerValidation(req.body);
  if(error) return res.status(400).send(error.details[0].message);

  //Hash password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  var name = req.body.name;
  var email = req.body.email;
  var password = hashPassword;

  var sql = `INSERT INTO users (name, email, password) VALUES ("${name}", "${email}", "${password}")`;
  db.query(sql, function(err, result) {
      if(err) {
          res.status(500).send({ error: 'Something failed!' })
      }
      res.json({'status': 'success', id: result.insertId})
  })
});

//Login
router.post('/login', function (req, res, next) {

  //Validate
  const {error} = loginValidation(req.body);
  if(error) return res.status(400).send(error.details[0].message);

  //check email
  var email = req.body.email;

  var sql = `SELECT * FROM users WHERE email='${email}'`;
  db.query(sql, async function(err, row, fields) {
    if(err) {
      res.status(500).send({ error: err.message })
    }
    
    if(!row[0]) return res.status(400).send('Email not found');

    let user = row[0];
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('Invalid password');

    // create token
    const token = jwt.sign({_id: user.id}, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send(token);

    // res.send('Logged in');
    // res.end();

  });
  
});

module.exports = router;
