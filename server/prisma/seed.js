/**
 * Database Seed Script - Frontdesk (Arvo Systems)
 *
 * Populates:
 * - Exactly 9 Arvo support agents (led by Meera)
 * - Enterprise customers
 * - Diverse tickets showcasing:
 *   - Critical urgent tickets (2 hr SLA)
 *   - Paused timer on WAITING_ON_CUSTOMER
 *   - Breached / late tickets (as Meera requested: "They need to know which ones are already late")
 *   - Unassigned tickets ready for collision-safe claiming
 *   - Private internal notes (demonstrating INC-0304 prevention)
 *   - Immutable audit trail (demonstrating INC-0318 compliance)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slaService = require('../services/slaService');

async function main() {
  console.log('🌱 Starting Frontdesk database seeding...');

  // 1. Clean existing records
  await prisma.auditLog.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.customer.deleteMany();

  // 2. Create the 9 Support Agents of Arvo Systems
  const agentsData = [
    { name: 'Meera (Lead)', email: 'meera@arvo.internal', role: 'SUPPORT_LEAD' },
    { name: 'Rahul Sharma', email: 'rahul.s@arvo.internal', role: 'SUPPORT_AGENT' },
    { name: 'Pooja Patel', email: 'pooja.p@arvo.internal', role: 'SUPPORT_AGENT' },
    { name: 'Arjun Nair', email: 'arjun.n@arvo.internal', role: 'SUPPORT_AGENT' },
    { name: 'Sneha Rao', email: 'sneha.r@arvo.internal', role: 'SUPPORT_AGENT' },
    { name: 'Vikram Das', email: 'vikram.d@arvo.internal', role: 'SUPPORT_AGENT' },
    { name: 'Ananya Sen', email: 'ananya.s@arvo.internal', role: 'SUPPORT_AGENT' },
    { name: 'Karthik Menon', email: 'karthik.m@arvo.internal', role: 'SUPPORT_AGENT' },
    { name: 'Priya Verma', email: 'priya.v@arvo.internal', role: 'SUPPORT_AGENT' }
  ];

  const agents = {};
  for (const a of agentsData) {
    const created = await prisma.agent.create({ data: a });
    agents[created.email] = created;
  }
  console.log(`✅ Created ${Object.keys(agents).length} support agents.`);

  // 3. Create Customers
  const customersData = [
    { name: 'Rajesh Malhotra', email: 'rajesh@apexlogistics.in', company: 'Apex Logistics' },
    { name: 'Sarah Connor', email: 'sarah@cloudscale.io', company: 'CloudScale Inc' },
    { name: 'Amit Bansal', email: 'amit@horizonfin.com', company: 'Horizon FinTech' },
    { name: 'Elena Rostova', email: 'elena@zenpay.net', company: 'ZenPay Global' },
    { name: 'David Miller', email: 'david@bluewave.org', company: 'BlueWave Media' }
  ];

  const customers = {};
  for (const c of customersData) {
    const created = await prisma.customer.create({ data: c });
    customers[created.email] = created;
  }
  console.log(`✅ Created ${Object.keys(customers).length} customer accounts.`);

  const now = new Date();

  // Helper for dates in past working hours
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // 4. Ticket 1: CRITICAL - Payment Gateway Dropouts (Unassigned, fresh, urgent)
  const slaT1 = slaService.calculateSLADueDates(now, 'CRITICAL');
  const t1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'INC-1001',
      title: 'CRITICAL: Production checkout API failing with 502 Bad Gateway',
      description: 'Customers across all mobile apps are receiving 502 errors during card processing. Revenue impact severe. Please investigate immediately.',
      priority: 'CRITICAL',
      status: 'OPEN',
      customerId: customers['rajesh@apexlogistics.in'].id,
      assignedToId: null, // Ready for claim test
      createdAt: now,
      firstReplyDueAt: slaT1.firstReplyDueAt,
      resolutionDueAt: slaT1.resolutionDueAt
    }
  });

  await prisma.auditLog.create({
    data: {
      ticketId: t1.id,
      actorType: 'CUSTOMER',
      actorName: 'Rajesh Malhotra (Apex Logistics)',
      action: 'TICKET_CREATED',
      details: JSON.stringify({ priority: 'CRITICAL', channel: 'Customer Webhook' })
    }
  });

  // 5. Ticket 2: MEDIUM - Waiting on customer (Timer PAUSED)
  const slaT2 = slaService.calculateSLADueDates(oneDayAgo, 'MEDIUM');
  const t2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'INC-1002',
      title: 'Webhook payload missing order metadata on invoice generation',
      description: 'When webhook event order.created fires, the custom metadata dictionary is empty. Need help confirming if our schema configuration is correct.',
      priority: 'MEDIUM',
      status: 'WAITING_ON_CUSTOMER',
      customerId: customers['sarah@cloudscale.io'].id,
      assignedToId: agents['rahul.s@arvo.internal'].id,
      createdAt: oneDayAgo,
      firstRepliedAt: new Date(oneDayAgo.getTime() + 45 * 60 * 1000), // Replied in 45 min
      firstReplyDueAt: slaT2.firstReplyDueAt,
      resolutionDueAt: slaT2.resolutionDueAt,
      waitingCustomerStartedAt: new Date(oneDayAgo.getTime() + 50 * 60 * 1000)
    }
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: t2.id,
      senderType: 'AGENT',
      senderId: agents['rahul.s@arvo.internal'].id,
      senderName: 'Rahul Sharma',
      content: 'Hi Sarah, could you provide the payload sample and the webhook delivery ID from your dashboard settings?'
    }
  });

  // Private internal note (INC-0304 demonstration)
  await prisma.internalNote.create({
    data: {
      ticketId: t2.id,
      agentId: agents['rahul.s@arvo.internal'].id,
      content: 'Private team note: Verified their account webhook settings. They are on legacy schema v1.4, which requires them to toggle "send_custom_fields". Do not share internal schema migration roadmap yet.'
    }
  });

  await prisma.auditLog.create({
    data: {
      ticketId: t2.id,
      actorType: 'AGENT',
      actorName: 'Rahul Sharma',
      action: 'AGENT_REPLIED',
      details: JSON.stringify({ note: 'Awaiting customer payload sample', timerState: 'PAUSED' })
    }
  });

  // 6. Ticket 3: CRITICAL - Late / Breached (Demonstrating Meera's late ticket tracking)
  const pastBreachDate = new Date(now.getTime() - 6 * 60 * 60 * 1000); // 6 hours ago
  const slaT3 = slaService.calculateSLADueDates(pastBreachDate, 'CRITICAL');
  const t3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'INC-1003',
      title: 'URGENT: Warehouse inventory sync stopped responding',
      description: 'All dispatch operations stalled. Warehouse terminals are showing offline status.',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      customerId: customers['amit@horizonfin.com'].id,
      assignedToId: agents['meera@arvo.internal'].id,
      createdAt: pastBreachDate,
      firstReplyDueAt: slaT3.firstReplyDueAt,
      resolutionDueAt: slaT3.resolutionDueAt,
      isFirstReplyBreached: true // Breached!
    }
  });

  await prisma.auditLog.create({
    data: {
      ticketId: t3.id,
      actorType: 'SYSTEM',
      actorName: 'Frontdesk SLA Monitor',
      action: 'SLA_BREACHED',
      details: JSON.stringify({ breachedTarget: 'First Reply SLA (2 Hours)', delayHours: 4 })
    }
  });

  // 7. Ticket 4: LOW - Documentation request
  const slaT4 = slaService.calculateSLADueDates(twoHoursAgo, 'LOW');
  const t4 = await prisma.ticket.create({
    data: {
      ticketNumber: 'INC-1004',
      title: 'Clarification regarding rate limits on GraphQL search query',
      description: 'Could you share what the maximum concurrency limit is for the search filter endpoint?',
      priority: 'LOW',
      status: 'OPEN',
      customerId: customers['david@bluewave.org'].id,
      assignedToId: agents['pooja.p@arvo.internal'].id,
      createdAt: twoHoursAgo,
      firstReplyDueAt: slaT4.firstReplyDueAt,
      resolutionDueAt: slaT4.resolutionDueAt
    }
  });

  // 8. Ticket 5: Resolved ticket (Within 5-day reopen window)
  const slaT5 = slaService.calculateSLADueDates(threeDaysAgo, 'MEDIUM');
  const t5 = await prisma.ticket.create({
    data: {
      ticketNumber: 'INC-1005',
      title: 'Update billing VAT ID on annual enterprise receipt',
      description: 'Please update our VAT registration number on invoice #INV-8821.',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      customerId: customers['elena@zenpay.net'].id,
      assignedToId: agents['arjun.n@arvo.internal'].id,
      createdAt: threeDaysAgo,
      firstRepliedAt: new Date(threeDaysAgo.getTime() + 30 * 60 * 1000),
      resolvedAt: new Date(threeDaysAgo.getTime() + 4 * 60 * 60 * 1000),
      firstReplyDueAt: slaT5.firstReplyDueAt,
      resolutionDueAt: slaT5.resolutionDueAt
    }
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: t5.id,
      senderType: 'AGENT',
      senderId: agents['arjun.n@arvo.internal'].id,
      senderName: 'Arjun Nair',
      content: 'The VAT ID has been updated and a revised receipt sent to your billing email.'
    }
  });

  await prisma.auditLog.create({
    data: {
      ticketId: t5.id,
      actorType: 'AGENT',
      actorName: 'Arjun Nair',
      action: 'STATUS_CHANGED',
      details: JSON.stringify({ oldStatus: 'IN_PROGRESS', newStatus: 'RESOLVED' })
    }
  });

  console.log('🎉 Seeding successfully completed! 5 realistic sample tickets with full SLA states and audit logs created.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
