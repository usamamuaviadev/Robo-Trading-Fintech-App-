const express = require('express');
const { authenticate } = require('../middleware/auth');
const reconciliationService = require('../services/reconciliationService');

const router = express.Router();

/**
 * @route   GET /api/reconciliation/all
 * @desc    Reconcile all wallets with master escrows
 * @access  Private (Admin only in production)
 */
router.get('/all', authenticate, async (req, res) => {
  try {
    const result = await reconciliationService.reconcileAll();
    res.status(200).json(result);
  } catch (error) {
    console.error('Reconciliation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reconcile'
    });
  }
});

/**
 * @route   GET /api/reconciliation/escrow/:masterEscrowId
 * @desc    Reconcile a specific master escrow
 * @access  Private (Admin only in production)
 */
router.get('/escrow/:masterEscrowId', authenticate, async (req, res) => {
  try {
    const { masterEscrowId } = req.params;
    const result = await reconciliationService.reconcileEscrow(masterEscrowId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Escrow reconciliation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reconcile escrow'
    });
  }
});

/**
 * @route   GET /api/reconciliation/wallet
 * @desc    Reconcile current user's wallet
 * @access  Private
 */
router.get('/wallet', authenticate, async (req, res) => {
  try {
    const result = await reconciliationService.reconcileUserWallet(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Wallet reconciliation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reconcile wallet'
    });
  }
});

/**
 * @route   POST /api/reconciliation/auto-fix/:masterEscrowId
 * @desc    Auto-fix minor discrepancies in escrow
 * @access  Private (Admin only in production)
 */
router.post('/auto-fix/:masterEscrowId', authenticate, async (req, res) => {
  try {
    const { masterEscrowId } = req.params;
    const { tolerance } = req.body;
    const result = await reconciliationService.autoFixDiscrepancy(
      masterEscrowId,
      tolerance || 0.01
    );
    res.status(200).json(result);
  } catch (error) {
    console.error('Auto-fix error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to auto-fix discrepancy'
    });
  }
});

module.exports = router;
