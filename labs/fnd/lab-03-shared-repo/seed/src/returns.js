// Returns handling for OrderDesk.
//
// A return covers one or more lines of an order. A refund against it must be
// approved by a refunds clerk before any money moves.

/**
 * Open a return request against an order.
 *
 * @param {object} order  the order being returned against
 * @param {Array}  lines  the order lines the customer is sending back
 * @returns {object} the new return request
 */
function openReturn(order, lines) {
  if (lines.length === 0) {
    throw new Error('a return must cover at least one line');
  }

  // RESOLUTION EXPLANATION:
  // Both guards are preserved to satisfy both business requirements:
  // 1. Story A (ODK-141): Exclude final-clearance items and reject if all items are clearance.
  // 2. Story B (ODK-152): Enforce the 30-day window policy if the order has been delivered.
  const eligibleLines = lines.filter((line) => !line.finalClearance);
  if (eligibleLines.length === 0) {
    throw new Error('returns on final clearance items are refused');
  }

  if (order.deliveredAt) {
    const deliveryTime = new Date(order.deliveredAt).getTime();
    const daysElapsed = (Date.now() - deliveryTime) / (24 * 60 * 60 * 1000);
    if (Math.floor(daysElapsed) > 30) {
      throw new Error('return refused: outside the 30-day return window');
    }
  }

  return {
    orderId: order.id,
    lines: eligibleLines,
    raisedAt: new Date().toISOString(),
    approvedBy: null,
    approvedAt: null,
  };
}

function approve(returnRequest, clerkId, reason) {
  if (!reason) {
    throw new Error('a refund approval must carry a reason');
  }

  return {
    ...returnRequest,
    approvedBy: clerkId,
    approvedAt: new Date().toISOString(),
    reason,
  };
}

module.exports = { openReturn, approve };
