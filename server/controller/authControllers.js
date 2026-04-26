import { compare } from "bcrypt";
import { pool } from "../libs/db.js";
import { comparePassword, createJWT, hashPassword } from "../libs/index.js";


export const signupUser = async (req, res) => {
  try {
    const { firstName, email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({
        status: "failed",
        message: "Please provide all required fields",
      });
    }

    // ✅ Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM tbluser WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: "failed",
        message: "Email already exists. Try logging in.",
      });
    }

    // ✅ Hash password
    const hashedPassword = await hashPassword(password);

    // ✅ Insert user
    const result = await pool.query(
      `INSERT INTO tbluser (firstName, email, password)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [firstName, email, hashedPassword]
    );

    const user = result.rows[0];

    res.status(201).json({
      status: "success",
      message: "User account created successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const signinUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "failed",
        message: "Please provide email and password",
      });
    }

    const result = await pool.query(
      "SELECT * FROM tbluser WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "Invalid email or password",
      });
    }


    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid email or password",
      });
    }

    
    const token = createJWT(user.id);


    delete user.password;

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

// export const signinUser = async (req, res) => {
//   try {

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ status: "failed", message: error.message });
//   }
// };
