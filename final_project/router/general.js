const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { registerUser } = require('./auth_users.js');

const general = express.Router();

general.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !username.trim() ||
      typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (!registerUser(username.trim(), password)) {
    return res.status(409).json({ message: 'Username already exists.' });
  }
  res.status(201).json({ message: 'User successfully registered.' });
});

general.get('/', (req, res) => res.json(books));

general.get('/isbn/:isbn', (req, res) => {
  const { isbn } = req.params;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  res.json(books[isbn]);
});

general.get('/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  res.json(Object.values(books).filter((book) => book.author.toLowerCase() === author));
});

general.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  res.json(Object.values(books).filter((book) => book.title.toLowerCase() === title));
});

general.get('/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  res.json(books[isbn].reviews);
});

// Axios clients for the four public book retrieval tasks.
const client = axios.create({
  baseURL: process.env.BOOKSHOP_URL || 'http://127.0.0.1:' + (process.env.PORT || 5000),
  timeout: 5000,
});

async function getAllBooks() {
  const { data } = await client.get('/');
  return data;
}

async function getBookByISBN(isbn) {
  const { data } = await client.get('/isbn/' + encodeURIComponent(isbn));
  return data;
}

async function getBooksByAuthor(author) {
  const { data } = await client.get('/author/' + encodeURIComponent(author));
  return data;
}

async function getBooksByTitle(title) {
  const { data } = await client.get('/title/' + encodeURIComponent(title));
  return data;
}

module.exports = { general, getAllBooks, getBookByISBN, getBooksByAuthor, getBooksByTitle };
