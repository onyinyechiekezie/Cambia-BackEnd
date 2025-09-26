const BlockchainServicMock = require("./blockChainServiceMock");

class SenderServiceImpl extends SenderService{
    constructor() {
        super();
        this.blockChainService = new BlockchainService
    }

    async placeOrder(orderRequest){

    }
}