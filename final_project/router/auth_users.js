const express = require('express');
const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const books = require('./booksdb.js');

const authenticated = express.Router();
const users = new Map();

function registerUser(username, password) {
  if (users.has(username)) return false;
  const salt = randomBytes(16);
  users.set(username, { salt, hash: scryptSync(password, salt, 64) });
  return true;
}

authenticated.post('/login', (req, res, next) => {
  const { username, password } = req.body || {};
  const name = typeof username === 'string' ? username.trim() : '';
  const user = users.get(name);
  if (!user || typeof password !== 'string' ||
      !timingSafeEqual(user.hash, scryptSync(password, user.salt, 64))) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }
  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.username = name;
    res.json({ message: 'User successfully logged in.', username: name });
  });
});

authenticated.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  const review = req.body?.review ?? req.query.review;
  if (typeof review !== 'string' || !review.trim()) {
    return res.status(400).json({ message: 'Review text is required.' });
  }
  const { reviews } = books[isbn];
  const username = req.session.username;
  const exists = Object.hasOwn(reviews, username);
  Object.defineProperty(reviews, username, {
    value: review.trim(), writable: true, enumerable: true, configurable: true,
  });
  res.status(exists ? 200 : 201).json({
    message: exists ? 'Review updated successfully.' : 'Review added successfully.',
    reviews,
  });
});

authenticated.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const username = req.session.username;
  if (!Object.hasOwn(books, isbn) || !Object.hasOwn(books[isbn].reviews, username)) {
    return res.status(404).json({ message: 'Review not found.' });
  }
  const { reviews } = books[isbn];
  delete reviews[username];
  res.json({ message: 'Review deleted successfully.', reviews });
});

module.exports = { authenticated, registerUser };
