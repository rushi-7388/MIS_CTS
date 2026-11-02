const express = require("express");
const router = express.Router();
const controller = require("../controllers/treasury.controller");

router.get("/overview", controller.getTreasuryOverview);
router.post("/discount-settlement", controller.executeEarlyDiscountSettlement);

module.exports = router;

