import jwt from "jsonwebtoken";

// Test JWT token generation
const testUser = {
  userId: "test-user-id",
  email: "admin@test.com",
  role: "admin"
};

const secret = process.env.JWT_SECRET || "fallback_secret_key_for_dev";
const token = jwt.sign(testUser, secret, { expiresIn: "1d" });

console.log("Test JWT Token:");
console.log(token);
console.log("\nDecoded token:");
console.log(jwt.verify(token, secret));

console.log("\nUse this token in Authorization header:");
console.log(`Authorization: Bearer ${token}`);