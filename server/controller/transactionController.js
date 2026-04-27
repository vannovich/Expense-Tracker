import { pool } from "../libs/db.js";
import { getMonthDate } from "../libs/index.js";

export const getTransactions = async (req, res) => {
  try {
    const { df, dt, s } = req.query;

    const { userId } = req.body.user;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const startDate = new Date(df || sevenDaysAgo);
    const endDate = new Date(dt || today);

    const search = s ? s.trim() : "";

    const result = await pool.query(
      `SELECT * FROM tbltransaction 
       WHERE user_id = $1 
       AND createdat BETWEEN $2 AND $3
       AND (
         $4 = '' OR
         description ILIKE '%' || $4 || '%' OR 
         status ILIKE '%' || $4 || '%' OR 
         source ILIKE '%' || $4 || '%'
       )
       ORDER BY id DESC`,
      [userId, startDate, endDate, search],
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

export const getDashboardInformation = async (req, res) => {
  try {
    const userId = req.body?.user?.userId;

    const totalsResult = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS totalincome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS totalexpense
       FROM tbltransaction
       WHERE user_id = $1`,
      [userId],
    );

    const totalIncome = Number(totalsResult.rows[0].totalincome);
    const totalExpense = Number(totalsResult.rows[0].totalexpense);
    const availableBalance = totalIncome - totalExpense;

    const year = new Date().getFullYear();

    const monthlyResult = await pool.query(
      `SELECT 
         EXTRACT(MONTH FROM createdat) AS month,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
       FROM tbltransaction
       WHERE user_id = $1 
         AND EXTRACT(YEAR FROM createdat) = $2
       GROUP BY month
       ORDER BY month`,
      [userId, year],
    );

    // ✅ 3. Map to 12 months (no heavy filtering)
    const monthlyMap = {};
    monthlyResult.rows.forEach((row) => {
      monthlyMap[Number(row.month)] = {
        income: Number(row.income),
        expense: Number(row.expense),
      };
    });

    const chartData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        label: getMonthDate(i),
        income: monthlyMap[month]?.income || 0,
        expense: monthlyMap[month]?.expense || 0,
      };
    });

    // ✅ 4. Parallel queries (faster)
    const [lastTransactionsResult, lastAccountResult] = await Promise.all([
      pool.query(
        `SELECT * FROM tbltransaction 
         WHERE user_id = $1 
         ORDER BY id DESC 
         LIMIT 5`,
        [userId],
      ),
      pool.query(
        `SELECT * FROM tblaccount 
         WHERE user_id = $1 
         ORDER BY id DESC 
         LIMIT 4`,
        [userId],
      ),
    ]);

    res.status(200).json({
      status: "success",
      availableBalance,
      totalIncome,
      totalExpense,
      chartData,
      lastTransactions: lastTransactionsResult.rows,
      lastaccount: lastAccountResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const addTransaction = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { account_id } = req.params;
    const { description, source, amount } = req.body;

    if (!description || !source || !amount) {
      return res.status(400).json({
        status: "failed",
        message: "Provide required fields",
      });
    }

    const parsedAmount = Number(amount);

    if (parsedAmount <= 0) {
      return res.status(400).json({
        status: "failed",
        message: "Amount should be greater than 0",
      });
    }

    const result = await pool.query("SELECT * FROM tblaccount WHERE id = $1", [
      account_id,
    ]);

    const accountInfo = result.rows[0];

    if (!accountInfo) {
      return res.status(404).json({
        status: "failed",
        message: "Invalid account information",
      });
    }

    if (accountInfo.user_id !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "Unauthorized access to account",
      });
    }

    if (
      accountInfo.account_balance <= 0 ||
      accountInfo.account_balance < parsedAmount
    ) {
      return res.status(403).json({
        status: "failed",
        message: "Insufficient account balance",
      });
    }

    await pool.query("BEGIN");

    // ✅ atomic deduction (important)
    const updateResult = await pool.query(
      `UPDATE tblaccount 
       SET account_balance = account_balance - $1, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = $2 AND account_balance >= $1
       RETURNING *`,
      [parsedAmount, account_id],
    );

    if (updateResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(403).json({
        status: "failed",
        message: "Insufficient balance",
      });
    }

    await pool.query(
      `INSERT INTO tbltransaction
       (user_id, description, type, status, amount, source) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, description, "expense", "completed", parsedAmount, source],
    );

    await pool.query("COMMIT");

    return res.status(200).json({
      status: "success",
      message: "Transaction completed successfully",
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);

    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const transferMoneyToAccount = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { from_account, to_account, amount } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: "failed",
        message: "Unauthorized user",
      });
    }

    if (!from_account || !to_account || !amount) {
      return res.status(400).json({
        status: "failed",
        message: "Provide required fields",
      });
    }

    if (from_account === to_account) {
      return res.status(400).json({
        status: "failed",
        message: "Cannot transfer to the same account",
      });
    }

    const newAmount = Number(amount);

    if (newAmount <= 0) {
      return res.status(400).json({
        status: "failed",
        message: "Amount should be greater than 0",
      });
    }

    await pool.query("BEGIN");

    const checkAccount = await pool.query(
      `SELECT account_balance FROM tblaccount WHERE id = $1`,
      [from_account],
    );

    if (checkAccount.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "Source account not found",
      });
    }

    if (Number(checkAccount.rows[0].account_balance) < newAmount) {
      await pool.query("ROLLBACK");
      return res.status(403).json({
        status: "failed",
        message: "Insufficient account balance",
      });
    }

    const fromResult = await pool.query(
      `UPDATE tblaccount 
       SET account_balance = account_balance - $1, updatedat = CURRENT_TIMESTAMP 
       WHERE id = $2 AND account_balance >= $1
       RETURNING *`,
      [newAmount, from_account],
    );

    if (fromResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(403).json({
        status: "failed",
        message: "Transfer failed due to insufficient balance",
      });
    }

    const fromAccount = fromResult.rows[0];

    const toResult = await pool.query(
      `UPDATE tblaccount 
       SET account_balance = account_balance + $1, updatedat = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [newAmount, to_account],
    );

    if (toResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        status: "failed",
        message: "Destination account not found",
      });
    }

    const toAccount = toResult.rows[0];

    await pool.query(
      `INSERT INTO tbltransaction
       (user_id, description, type, status, amount, source) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        fromAccount.user_id,
        `Transfer to ${toAccount.account_name}`,
        "expense",
        "completed",
        newAmount,
        fromAccount.account_name,
      ],
    );

    await pool.query(
      `INSERT INTO tbltransaction
       (user_id, description, type, status, amount, source) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        toAccount.user_id,
        `Received from ${fromAccount.account_name}`,
        "income",
        "completed",
        newAmount,
        toAccount.account_name,
      ],
    );

    await pool.query("COMMIT");

    return res.status(200).json({
      status: "success",
      message: "Transfer completed successfully",
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);

    return res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};
