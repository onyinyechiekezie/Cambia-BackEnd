// src/models/OrderStatus.js

const Status = Object.freeze({
  PENDING: "pending",
  RECEIVED: "received",
  PREPARED: "prepared",
  PROOF_UPLOADED: "proof_uploaded",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
});

module.exports = Status;
