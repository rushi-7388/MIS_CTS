const marketplaceService = require("../services/liquidity-marketplace.service");

function getMarketplaceOverview(req, res) {
  try {
    const data = marketplaceService.getMarketplaceOverview();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function listReceivable(req, res) {
  try {
    const { chequeNumber, presentingBank, draweeBank, faceValue, hoursToClearing, riskScore, collateralType } = req.body;
    if (!faceValue || !chequeNumber) {
      return res.status(400).json({ error: "Missing required fields: faceValue and chequeNumber" });
    }
    const listing = marketplaceService.listReceivable({
      chequeNumber,
      presentingBank: presentingBank || "SURAT PEOPLES CO OP BANK",
      draweeBank: draweeBank || "HDFC BANK",
      faceValue,
      hoursToClearing,
      riskScore,
      collateralType,
    });
    return res.status(201).json(listing);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function executeBuyout(req, res) {
  try {
    const { assetId, buyerBank } = req.body;
    if (!assetId) {
      return res.status(400).json({ error: "Missing required field: assetId" });
    }
    const result = marketplaceService.executeInstantBuyout({ assetId, buyerBank });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMarketplaceOverview,
  listReceivable,
  executeBuyout,
};

