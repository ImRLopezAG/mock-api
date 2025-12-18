// Existing imports
const express = require('express');
const cors = require('cors'); // Import the 'cors' package

// Initialize Express app
const app = express();

// Use CORS middleware
app.use(cors()); // Allow all origins

// Define routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});