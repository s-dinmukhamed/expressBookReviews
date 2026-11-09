const express = require('express');
const session = require('express-session');
const { randomBytes } = require('node:crypto');
const { authenticated } = require('./router/auth_users.js');
const { general } = require('./router/general.js');

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(express.json());
app.use('/customer', session({
  secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));
app.use('/customer/auth', (req, res, next) => {
  if (!req.session.username) {
    return res.status(401).json({ message: 'Please log in first.' });
  }
  next();
});
app.use('/customer', authenticated);
app.use('/', general);

app.listen(port, '127.0.0.1', () => console.log('Bookshop listening on port ' + port));
