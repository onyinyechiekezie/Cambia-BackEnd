class OrderRequest {
    constructor(vendorID, products, quantity, trustlessSwapID) {
        this.vendorID = vendorID;
        this.products = products;   
        this.quantity = quantity;      
        this.trustlessSwapID = trustlessSwapID;
    }
}

module.exports = OrderRequest;

