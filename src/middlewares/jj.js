const AuthServiceImpl = require('../services/authServiceImpl');

class AuthController {
  constructor() {
    this.authService = new AuthServiceImpl();
  }

  // POST /api/auth/register
  register = async (req, res) => {
    try {
      const result = await this.authService.register(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Register error:", error.message);
      return res.status(400).json({ status: false, message: error.message });
    }
  };

  // POST /api/auth/login
  login = async (req, res) => {
    try {
      const result = await this.authService.login(req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Login error:", error.message);
      return res.status(400).json({ status: false, message: error.message });
    }
  };

  // GET /api/auth/verify?token=<jwt>
  verify = async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ status: false, message: "Token is required" });
      }

      const payload = this.authService.verifyToken(token);
      return res.status(200).json({ status: true, payload });
    } catch (error) {
      console.error("Verify error:", error.message);
      return res.status(401).json({ status: false, message: error.message });
    }
  };
}

module.exports = AuthController;
