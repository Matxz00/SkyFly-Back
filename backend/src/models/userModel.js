import pool from '../config/db.js';

const User = {
  /**
   * Actualiza el código temporal de 2FA y su expiración para un usuario.
   * Si code o expires es null, limpia los campos.
   */
  updateTwoFactorCode: async (userId, code, expires) => {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET two_factor_secret = ?, two_factor_secret_expires = ? WHERE id = ?',
        [code, expires, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar código 2FA en el modelo:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo usuario en la base de datos.
   * twoFactorEnabled se establece en true por defecto al crear el usuario.
   */
  async create(username, email, password) {
    try {
      console.log('Modelo: Intentando insertar usuario con:', { username, email, password });
      const twoFactorEnabled = true;

      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password, two_factor_enabled) VALUES (?, ?, ?, ?)',
        [username, email, password, twoFactorEnabled]
      );
      console.log('Modelo: Resultado de la inserción SQL:', result);
      return result.insertId;
    } catch (error) {
      console.error('Modelo: ERROR al crear usuario (catch en model):', error);
      throw error;
    }
  },

  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  async updatePassword(id, newPassword) {
    await pool.execute(
      'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [newPassword, id]
    );
  },

  async updateResetToken(id, token, expires) {
    await pool.execute(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [token, expires, id]
    );
  },

  async findByResetToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );
    return rows[0];
  },

  async updateTwoFactorSecret(id, secret, enabled) {
    await pool.execute(
      'UPDATE users SET two_factor_secret = ?, two_factor_enabled = ? WHERE id = ?',
      [secret, enabled, id]
    );
  },

  /**
   * Actualiza el estado de la verificación en dos pasos (habilitado/deshabilitado) para un usuario.
   */
  updateTwoFactorStatus: async (id, enabled) => {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET two_factor_enabled = ? WHERE id = ?',
        [enabled, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar estado 2FA en el modelo:', error);
      throw error;
    }
  }
};

export default User;
