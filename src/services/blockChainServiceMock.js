const BlockChainService = require("../../src/services/senderServiceImpl");

class BlockChainServiceMock extends BlockChainService {
    async fundOrderTx(orderId, amount, walletAddress) {
        return {
            txHash: "0xmocked_" + orderId,
            status: "success",
            amount,
            walletAddress,
        }
    }
}

module.exports = BlockChainServiceMock;