import { pool } from "../libs/db.js";
import { comparePassword, hashPassword } from "../libs/index.js";

export const getUser = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const userExist = await pool.query("SELECT * FROM tbluser WHERE id = $1", [
      userId,
    ]);

    const user = userExist.rows[0];

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    delete user.password;

    res.status(201).json({
      status: "success",
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

export const changePassword = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: "failed",
        message: "All password fields are required",
      });
    }

    const result = await pool.query("SELECT * FROM tbluser WHERE id = $1", [
      userId,
    ]);

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "failed",
        message: "New passwords do not match",
      });
    }

    const isMatch = await comparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid current password",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await pool.query(
      "UPDATE tbluser SET password = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, userId],
    );

    return res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.body.user;

    const { firstName, lastName, country, currency, contact } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM tbluser WHERE id = $1",
      [userId],
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    const result = await pool.query(
      `UPDATE tbluser
       SET firstname = COALESCE($1, firstname),
           lastname = COALESCE($2, lastname),
           country = COALESCE($3, country),
           currency = COALESCE($4, currency),
           contact = COALESCE($5, contact),
           updatedat = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [firstName, lastName, country, currency, contact, userId],
    );

    const updatedUser = result.rows[0];
    delete updateUser.password;

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};
