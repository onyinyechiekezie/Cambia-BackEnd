const BlockchainServicMock = require("./blockChainServiceMock");

class SenderServiceImpl extends SenderService{
    constructor() {
        super();
        this.blockChainService = new BlockchainServiceMock();
    }

    async placeOrder(orderRequest){

    }
}