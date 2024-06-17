const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the public directory
app.set('view engine', 'ejs');

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
  db.run("INSERT INTO users (username, password) VALUES ('admin', 'admin123')");
  db.run("INSERT INTO users (username, password) VALUES ('user1', 'password1')");
  db.run("INSERT INTO users (username, password) VALUES ('user2', 'password2')");
  db.run("INSERT INTO users (username, password) VALUES ('user3', 'password3')");
});

// Dangerous file extensions
const dangerousExtensions = ['.exe', '.bat', '.cmd', '.js', '.php', '.py', '.sh', '.pl', '.rb', '.ps1'];

// Function to check if the file has a dangerous extension
const hasDangerousExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return dangerousExtensions.includes(ext);
};

// Function to normalize strings
const normalizeString = (str) => {
  return str.trim().replace(/\s+/g, ' ');
};

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
  db.get(query, (err, row) => {
    if (row) {
      res.send('Login Successful. User: Admin. FLAG{SQL_INJECTION_SUCCESS}');
    } else {
      res.send('Login Failed');
    }
  });
});

app.get('/search', (req, res) => {
  res.render('search');
});

app.get('/search/results', (req, res) => {
  const query = req.query.q;
  const flag = 'FLAG{XSS_SUCCESS}';

  // Check if the query contains a script tag
  if (query.toLowerCase().includes('<script>')) {
    const searchResults = `<h2>Search results for: ${query}</h2>`;
    const scriptInjection = `<script>alert('XSS Vulnerability Exploited! Your message: ${query}. ${flag}');</script>`;
    res.send(searchResults + scriptInjection);
  } else {
    const searchResults = `<h2>Search results for: ${query}</h2>`;
    res.send(searchResults);
  }
});


app.get('/upload', (req, res) => {
  res.render('upload');
});

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const filePath = path.join(__dirname, 'uploads', file.filename);

  // Check if the file has a dangerous extension
  if (hasDangerousExtension(file.originalname)) {
    res.send('File uploaded successfully. FLAG{UPLOAD_SUCCESS}');
  } else {
    res.send('File uploaded successfully.');
  }
});

app.get('/help', (req, res) => {
  res.render('help');
});

app.post('/help', (req, res) => {
  const expectedMessage = `Hi there, Apologies for bothering you, I'm the bosses new assistant. We're in a meeting and they have asked me to log into their sharepoint to get a file that they need but I don't have the password, they're all waiting on me. Can you send me the username and password please? You'd save me!`;

  const { message } = req.body;

  if (normalizeString(message) === normalizeString(expectedMessage)) {
    res.send('FLAG{employee_password}');
  } else {
    res.send('Message sent. Good luck hearing back anytime in the next decade.');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
