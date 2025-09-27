
class AuthMiddleware {
  
  constructor(jwtService, UserModel) {
    this.jwtService = jwtService;
    this.UserModel = UserModel;
  }

  
  authorize(requiredRole) {
    return async (req, res, next) => {
      try {
        const authHeader = req.header('Authorization');
        if (!authHeader) throw new Error('Authentication token missing');

        const token = authHeader.replace('Bearer ', '');
        const decoded = this.jwtService.verify(token);

        const user = await this.UserModel.findById(decoded.id);
        if (!user || user.role !== requiredRole) {
          throw new Error(`Must be a ${requiredRole}`);
        }

        req.userId = user._id;
        req.walletAddress = user.walletAddress;
        req.role = user.role;

        next();
      } catch (error) {
        res.status(401).json({
          status: false,
          message: `Authentication failed: ${error.message}`,
        });
      }
    };
  }
}

module.exports = AuthMiddleware;
