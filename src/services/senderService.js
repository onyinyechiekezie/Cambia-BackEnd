class SenderService {
    constructor() {
        if(new.target === SenderService)  {
            throw new Error("Cannot instantiate absract class Sender directly");
        }
    }

    async placeOrder(orderRequest) {
        throw new Error("Method not implemented");
    }

    async fundOrder(fundRequest) {
        throw new Error("Method not implemented");
    }

    async trackOrder(trackRequest) {
        throw new Error("Method not implemented");
    }

    async confirmReceipt(confirmRequest) {
        throw new Error("Method not implemented")
    }
}