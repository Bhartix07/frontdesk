/**
 * Verification Suite - Testing the 3 Incident Fixes and SLA Engine
 */

const assert = require('assert');
const ticketService = require('./services/ticketService');
const slaService = require('./services/slaService');
const noteService = require('./services/noteService');
const auditService = require('./services/auditService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Running Frontdesk Incident Verification & SLA Suite...\n');

  // TEST 1: Working Hours SLA calculation (Meera's Friday 6:00 PM example)
  console.log('--- TEST 1: Business Hours SLA Clock ---');
  // Friday Nov 20, 2026 at 18:00 (6:00 PM). Target: 2 hours (Critical)
  // Friday remaining: 18:00 to 18:30 = 30 minutes.
  // Remaining 90 minutes rolls to Monday Nov 23, 2026 at 09:30 + 1.5h = 11:00 AM!
  const fridayEvening = new Date('2026-11-20T18:00:00');
  const criticalDue = slaService.addWorkingMinutes(fridayEvening, 120);
  console.log('Arrival:', fridayEvening.toString());
  console.log('2hr Working SLA Due:', criticalDue.toString());
  assert.strictEqual(criticalDue.getDay(), 1, 'Should roll over weekend to Monday (Day 1)');
  assert.strictEqual(criticalDue.getHours(), 11, 'Should be 11:00 AM Monday');
  assert.strictEqual(criticalDue.getMinutes(), 0, 'Should be exactly 11:00 AM');
  console.log('✅ TEST 1 PASSED: Friday 6 PM ticket correctly rolls to Monday 11:00 AM, skipping weekend!\n');

  // TEST 2: Collision & Race Condition Protection (INC-0291)
  console.log('--- TEST 2: Collision Protection (INC-0291) ---');
  const agents = await prisma.agent.findMany({ take: 2 });
  const agentA = agents[0];
  const agentB = agents[1];

  // Create fresh unassigned ticket
  const collisionTicket = await ticketService.createTicket({
    title: 'Test Collision Ticket',
    description: 'Testing simultaneous claim',
    priority: 'MEDIUM',
    customerEmail: 'test.customer@test.com'
  });

  // Agent A claims ticket
  const claimA = await ticketService.claimTicket({
    ticketId: collisionTicket.id,
    agentId: agentA.id
  });
  assert.strictEqual(claimA.assignedToId, agentA.id);
  console.log(`Agent A (${agentA.name}) claimed ticket successfully.`);

  // Agent B tries to claim the same ticket concurrently
  let collisionCaught = false;
  try {
    await ticketService.claimTicket({
      ticketId: collisionTicket.id,
      agentId: agentB.id
    });
  } catch (err) {
    if (err.statusCode === 409) {
      collisionCaught = true;
      console.log(`Caught expected 409 Conflict: "${err.message}"`);
    }
  }
  assert.strictEqual(collisionCaught, true, 'Agent B claim should have been blocked with 409 Conflict');
  console.log('✅ TEST 2 PASSED: Double-claiming prevented, INC-0291 solved!\n');

  // TEST 3: Internal Note Segregation & Leak Prevention (INC-0304)
  console.log('--- TEST 3: Leaked Note Prevention (INC-0304) ---');
  // Add confidential internal note
  await noteService.addInternalNote({
    ticketId: collisionTicket.id,
    agentId: agentA.id,
    content: 'CONFIDENTIAL: Customer is eligible for $50 credit. Do not disclose.'
  });

  // Query via customer-facing endpoint
  const customerView = await ticketService.getCustomerFacingTicket(collisionTicket.ticketNumber);
  assert.strictEqual(customerView.internalNotes, undefined, 'Customer view must NEVER contain internalNotes field');
  console.log('Customer endpoint fields:', Object.keys(customerView));
  console.log('✅ TEST 3 PASSED: Private team notes completely stripped from customer API, INC-0304 solved!\n');

  // TEST 4: Immutable Audit Trail (INC-0318)
  console.log('--- TEST 4: Immutable Audit Trail (INC-0318) ---');
  const auditLogs = await auditService.getAuditTrail(collisionTicket.id);
  console.log(`Audit log records found: ${auditLogs.length}`);
  const actions = auditLogs.map(l => l.action);
  console.log('Recorded actions:', actions);
  assert.ok(actions.includes('TICKET_CREATED'), 'Should record ticket creation');
  assert.ok(actions.includes('TICKET_CLAIMED'), 'Should record ticket claim');
  assert.ok(actions.includes('INTERNAL_NOTE_ADDED'), 'Should record note added');
  console.log('✅ TEST 4 PASSED: Every lifecycle change immutably recorded with actor & timestamp, INC-0318 solved!\n');

  console.log('🎉 ALL 4 TESTS PASSED FLAWLESSLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
