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
        // La verificación en dos pasos estará habilitada por defecto para todos los nuevos usuarios
        const twoFactorEnabled = true;

        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password, two_factor_enabled) VALUES (?, ?, ?, ?)',
            [username, email, password, twoFactorEnabled]
        );
        return result.insertId;
    },

    async findByEmail(email) {
        // SELECT * asegura que todas las columnas, incluyendo two_factor_enabled, sean devueltas
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    async findById(id) {
        // SELECT * asegura que todas las columnas, incluyendo two_factor_enabled, sean devueltas
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    },

    async updatePassword(id, newPassword) {
        // Asumiendo que password_reset_token y password_reset_expires son los nombres correctos de tus columnas
        await pool.execute('UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?', [newPassword, id]);
    },

    async updateResetToken(id, token, expires) {
        // Asumiendo que password_reset_token y password_reset_expires son los nombres correctos de tus columnas
        await pool.execute(
            'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
            [token, expires, id]
        );
    },

    async findByResetToken(token) {
        // Asumiendo que password_reset_token y password_reset_expires son los nombres correctos de tus columnas
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
            [token]
        );
        return rows[0];
    },

    // Este método 'updateTwoFactorSecret' se usaba para TOTP.
    // Si no lo vas a usar para 2FA por correo, puedes eliminarlo.
    // Lo he dejado por si acaso, pero no se usará en el flujo de 2FA por correo.
    async updateTwoFactorSecret(id, secret, enabled) {
        await pool.execute(
            'UPDATE users SET two_factor_secret = ?, two_factor_enabled = ? WHERE id = ?',
            [secret, enabled, id]
        );
    },

    /**
     * Actualiza el estado de la verificación en dos pasos (habilitado/deshabilitado) para un usuario.
     * Se renombra a 'updateTwoFactorStatus' para mayor claridad y se usa para los botones de perfil.
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