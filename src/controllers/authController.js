const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const RegisterDTO = require("../dtos/register.dto");
const LoginDTO = require("../dtos/login.dto");

const registerValidator = require("../validators/registerValidator");
const loginValidator = require("../validators/loginValidator");

exports.register = async (req, res) => {
  try {
    const { error } = registerValidator.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const dto = new RegisterDTO(req.body);

    const existingUser = await User.findOne({ email: dto.email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new User({ ...dto, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { error } = loginValidator.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const dto = new LoginDTO(req.body);

    const user = await User.findOne({ email: dto.email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(dto.password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
