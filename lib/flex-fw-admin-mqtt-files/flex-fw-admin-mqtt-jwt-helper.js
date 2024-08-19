// jwtHelper.js

const jwt = require('jsonwebtoken');

// This function generates a JWT token
function createToken(payload, expiresIn = '59000') {
  // Get the secret key from the environment variables
  const secretKey = process.env.JWT_SECRET || 'default-secret-key';

  // Generate the JWT token
  const token = jwt.sign(payload, secretKey, { expiresIn });

  return token;
}

// This function verifies and decodes a JWT token
function readToken(token) {
  try {
    // Get the secret key from the environment variables
    const secretKey = process.env.JWT_SECRET || 'default-secret-key';

    // Verify and decode the token
    const decoded = jwt.verify(token, secretKey);

    return decoded; // Return the decoded payload
  } catch (err) {
    // Handle the case where the token is invalid or expired
    return { error: 'Invalid or expired token' };
  }
}

// Export both functions
module.exports = {
  createToken,
  readToken,
};
