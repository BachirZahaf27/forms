if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

// calling the validation function that takes user.email & user.id
const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

// storing data
const users = []
// adding ejs so the system can acces the data enterd in the ejs forms
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({// PROBLEM
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

//--- ROUTES 
// HOME , first check if he's authenticated, if yes redricet to index.ejs else go to login
app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name })
})
// Login , first check if he is not authenticated, if he isn't auth then redirect to login.ejs, else to index.ejs
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})
// log user in,
// first check if he is not authenticated, if he isn't auth then redirect to login.ejs, else to index.ejs
// Second validate his username&password with passport, if exsit => home, else =>login 
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))
// Signin , first check if he is not authenticated, if he isn't auth then redirect to register.ejs, else to index.ejs
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})
// register user in,
// first check if he is not authenticated, if he isn't auth then redirect to login.ejs, else to index.ejs
// Second push the entered info&hasedp to db and =>login, else =>register
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})
// loginout with buttun in index.ejs
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.listen(3000)