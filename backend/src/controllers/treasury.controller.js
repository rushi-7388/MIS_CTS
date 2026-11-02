const treasuryService = require("../services/corporate-treasury.service");

function getTreasuryOverview(req, res) {
  try {
    const { entityKey } = req.query;
    const data = treasuryService.getTreasuryOverview(entityKey);
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function executeEarlyDiscountSettlement(req, res) {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ error: "Missing required field: invoiceId" });
    }
    const result = treasuryService.executeEarlyDiscountSettlement(invoiceId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getTreasuryOverview,
  executeEarlyDiscountSettlement,
};

