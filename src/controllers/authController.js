const AuthServiceImpl = require('../services/authServiceImpl');

class AuthController {
  constructor() {
    this.authService = new AuthServiceImpl();
  }

  register = async (req, res) => {
    try {
      const result = await this.authService.register(req.body);
      return res.status(201).json(result);
    } catch (error){
      console.error("Register error: ", error.message);
      return res.status(400).json({ status: false, message: error });
    }
  };

  login = async (req, res)=> {
    try {
      const result = await this.authService.login(req.body);
      res.setHeader("Authorization", `Bearer ${result.token}`);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Login error: ", error.message);
      return res.status(400).json({ status: false, message: error.message})
    }
  };

  verify = async (req, res)=> {
    try {
      const {token} = req.query;
      if(!token) {
        return res.status(400).json({status: false, message: "Token is required"})
      }

      const payload = this.authService.verifyToken(token);
      return res.status(200).json({ status: true, payload });
    } catch (error) {
      console.error("Verify error: ", error.message);
      return res.status(401).json({ status: false, message: error.message})
    }
  };
}

module.exports = AuthController;