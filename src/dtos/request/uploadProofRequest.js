class UploadProofRequest {
  constructor(orderId, proofHash) {
    this.orderId = orderId;
    this.proofHash = proofHash; // IPFS hash
  }
}

module.exports = UploadProofRequest;
