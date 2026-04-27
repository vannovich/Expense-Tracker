import { pool } from "../libs/db.js";

export const getAccounts = async (req, res) => {
  try {
    const { userId } = req.body.user;

    if (!userId) {
      return res.status(400).json({
        status: "failed",
        message: "User not found",
      });
    }

    const result = await pool.query(
      "SELECT * FROM tblaccount WHERE user_id = $1",
      [userId],
    );

    return res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { name, amount, account_number } = req.body;

    if (!userId || !name || !amount || !account_number) {
      return res.status(400).json({
        status: "failed",
        message: "All fields are required",
      });
    }

    const accountExistResult = await pool.query(
      "SELECT * FROM tblaccount WHERE account_name = $1 AND user_id = $2",
      [name, userId],
    );

    if (accountExistResult.rows.length > 0) {
      return res.status(409).json({
        status: "failed",
        message: "Account already exists",
      });
    }

    const createAccountResult = await pool.query(
      `INSERT INTO tblaccount(user_id, account_name, account_number, account_balance)
       VALUES($1, $2, $3, $4)
       RETURNING *`,
      [userId, name, account_number, Number(amount)],
    );

    const account = createAccountResult.rows[0];

   await pool.query(
  `UPDATE tbluser 
   SET accounts = array_append(COALESCE(accounts, '{}'), $1),
       updatedat = CURRENT_TIMESTAMP 
   WHERE id = $2`,
  [name, userId]
);

    const description = `${account.account_name} (Initial Deposit)`;

    await pool.query(
      `INSERT INTO tbltransaction(user_id, description, type, status, amount, source)
       VALUES($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        description,
        "income",
        "completed",
        Number(amount),
        account.account_name,
      ],
    );

    return res.status(201).json({
      status: "success",
      message: `${account.account_name} account created successfully`,
      data: account,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const addMoneyToAccount = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.params;
    const { amount } = req.body;

    const newAmount = Number(amount);

    if (!userId || !id || !newAmount || newAmount <= 0) {
      return res.status(400).json({
        status: "failed",
        message: "Valid amount and account ID are required",
      });
    }

    const accountCheck = await pool.query(
      "SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    const account = accountCheck.rows[0];

    if (!account) {
      return res.status(404).json({
        status: "failed",
        message: "Account not found",
      });
    }

    const result = await pool.query(
      `UPDATE tblaccount 
       SET account_balance = account_balance + $1,
           updatedat = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [newAmount, id],
    );

    const updatedAccount = result.rows[0];

    const description = `${updatedAccount.account_name} (Deposit)`;

    await pool.query(
      `INSERT INTO tbltransaction(user_id, description, type, status, amount, source)
       VALUES($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        description,
        "income",
        "completed",
        newAmount,
        updatedAccount.account_name,
      ],
    );

    return res.status(200).json({
      status: "success",
      message: "Deposit successful",
      data: updatedAccount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};
