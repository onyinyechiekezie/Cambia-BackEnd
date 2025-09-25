// AuthServiceImpl.js
class AuthServiceImpl extends AuthService {
  constructor(userRepository, jwtService) {
    super();
    this.userRepository = userRepository; // abstraction
    this.jwtService = jwtService;
  }

  async register(authData) {
    const validated = RegisterRequestDTO.validate(authData);
    const user = await this.userRepository.createUser(validated);
    return AuthResponseDTO.fromUserData(user);
  }

  async login(authData) {
    const validated = LoginRequestDTO.validate(authData);
    const user = await this.userRepository.findByEmail(validated.email);
    const validPassword = await bcrypt.compare(validated.password, user.password);
    if (!validPassword) throw new Error('Invalid credentials');
    const token = this.jwtService.sign({ id: user.id, email: user.email });
    return { token, user: AuthResponseDTO.fromUserData(user) };
  }
}

// BlockchainService.js
class BlockchainService {
  constructor(client) {
    this.client = client;
  }

  async registerUserOnChain(user) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${suiContractAddress}::DiasporaRemittance::store_user`,
      arguments: [
        tx.pure(user.id),
        tx.pure(user.email),
        tx.pure(user.walletAddress),
        tx.pure(user.role),
      ],
    });
    return this.client.signAndExecuteTransactionBlock({ transactionBlock: tx });
  }
}
