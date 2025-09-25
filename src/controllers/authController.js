const AuthServiceImpl = require('../services/authServicesImpl');

class AuthController {
  constructor() {
    this.authService = new AuthServiceImpl();
  }

  register = async (req, res) => {
    try {
      const result = await this.authService.register(req.body);
      return res.status(201).json(result);
    } catch {
      console.error("Register error: ", error.message);
      return res.status(400).json({ status: false, message: error });
    }
  };

  login = async (req, res)=> {
    try {
      const result = await this.authService.login(req.body);
      return res.status(200).json(result);
    }
  }

}