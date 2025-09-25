

class AuthServiceImpl extends AuthService {
  
  
    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const userData = { id, ...validated, password: hashedPassword };

    const user = await User.create(userData);

    if (user.role === 'sender') await Sender.create(userData);
    else if (user.role === 'vendor') await Vendor.create(userData);

    return AuthResponseDTO.fromUserData(user);
  }

  async login(authData) {
    const validated = LoginValidator.validate(authData);

    const user = await User.findOne({ email: validated.email });
    if (!user) throw new Error('Invalid email or password');

    const isPasswordValid = await bcrypt.compare(validated.password, user.password);
    if (!isPasswordValid) throw new Error('Invalid email or password');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, walletAddress: user.walletAddress },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return { };
  }
}

module.exports = AuthServiceImpl;
