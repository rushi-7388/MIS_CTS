const express = require("express");
const router = express.Router();
const controller = require("../controllers/marketplace.controller");

router.get("/overview", controller.getMarketplaceOverview);
router.post("/list", controller.listReceivable);
router.post("/buyout", controller.executeBuyout);

module.exports = router;

