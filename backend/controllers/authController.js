const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { sendJson } = require("../utils/http");
const { signJwt } = require("../utils/jwt");

async function signup(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone
    } = req.body;

    if (!firstName || !email || !password) {
      return sendJson(res, 400, {
        message: "First name, email and password are required."
      });
    }

    // Check existing email
    const existing = await pool.query(
      "SELECT id FROM admins WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return sendJson(res, 409, {
        message: "Email already exists."
      });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `
      INSERT INTO admins
      (
        first_name,
        last_name,
        email,
        password,
        phone
      )
      VALUES
      (
        $1,$2,$3,$4,$5
      )
      RETURNING
        id,
        first_name,
        last_name,
        email,
        role,
        phone
      `,
      [
        firstName,
        lastName,
        email,
        hashedPassword,
        phone
      ]
    );

    const admin = result.rows[0];

    const token = signJwt({
      sub: admin.id,
      name: `${admin.first_name} ${admin.last_name ?? ""}`.trim(),
      email: admin.email,
      role: admin.role
    });

    return sendJson(res, 201, {
      message: "Account created successfully.",
      token,
      user: {
        id: admin.id,
        name: `${admin.first_name} ${admin.last_name ?? ""}`.trim(),
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {
    console.error(err);

    return sendJson(res, 500, {
      message: "Internal Server Error"
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT *
       FROM admins
       WHERE email = $1
         AND is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 401, {
        message: "Invalid email or password",
      });
    }

    const admin = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return sendJson(res, 401, {
        message: "Invalid email or password",
      });
    }

    await pool.query(
      `UPDATE admins
       SET last_login = NOW()
       WHERE id = $1`,
      [admin.id]
    );

    const token = signJwt({
      sub: admin.id,
      name: `${admin.first_name} ${admin.last_name ?? ""}`.trim(),
      email: admin.email,
      role: admin.role,
    });

    return sendJson(res, 200, {
      message: "Login successful",
      token,
      user: {
        id: admin.id,
        name: `${admin.first_name} ${admin.last_name ?? ""}`.trim(),
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error(error);

    return sendJson(res, 500, {
      message: "Internal Server Error",
    });
  }
}


function profile(req, res) {
  sendJson(res, 200, { user: req.user });
}

module.exports = {
  signup,
  login,
  profile,
};