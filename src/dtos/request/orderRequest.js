class OrderRequest {
    constructor(senderID, vendorID, productName, quantity, amount, status, trustlessSwapID) {
        this.senderID = senderID;
        this.vendorID = vendorID;
        this.productName = productName;
        this.quantity = quantity;
        this.amount = amount;
        this.status = status;
        this.trustlessSwapID = trustlessSwapID;
    }
}

module.exports =OrderRequest;
