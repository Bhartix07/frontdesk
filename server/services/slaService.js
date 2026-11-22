/**
 * SLA Service - Frontdesk (Arvo Systems)
 *
 * Implements business-hours-aware SLA calculation according to Arvo's policies:
 * - Working hours: 09:30 to 18:30 (9 hours/day = 540 minutes/day)
 * - Working days: Monday to Friday
 * - Excludes weekends (Saturday & Sunday) and defined Festival Holidays
 * - Pause during WAITING_ON_CUSTOMER states
 * - Priority recalculation logic based on elapsed working time
 * - Auto-close after 5 working days of customer inactivity
 * - Reopen allowed only within 5 working days of resolution
 */

// Official / Company Festival Holidays (YYYY-MM-DD)
const HOLIDAYS = [
  '2026-01-26', // Republic Day
  '2026-03-25', // Holi
  '2026-04-14', // Vishu / Ambedkar Jayanti
  '2026-05-01', // May Day
  '2026-08-15', // Independence Day
  '2026-08-28', // Onam
  '2026-10-02', // Gandhi Jayanti
  '2026-10-20', // Dussehra
  '2026-11-08', // Diwali
  '2026-12-25', // Christmas
];

const WORK_START_HOUR = 9;
const WORK_START_MINUTE = 30;
const WORK_END_HOUR = 18;
const WORK_END_MINUTE = 30;
const MINUTES_PER_WORK_DAY = 9 * 60; // 540 minutes

// SLA Tiers in working minutes
const SLA_CONFIG = {
  CRITICAL: {
    firstReplyMinutes: 2 * 60,       // 2 working hours
    resolutionMinutes: 9 * 60,       // Same working day (9 working hours)
    name: 'Critical'
  },
  MEDIUM: {
    firstReplyMinutes: 4.5 * 60,     // Half working day (4.5 hours = 270 minutes)
    resolutionMinutes: 3 * 9 * 60,   // 3 working days (1620 minutes)
    name: 'Medium'
  },
  LOW: {
    firstReplyMinutes: 9 * 60,       // 1 working day (540 minutes)
    resolutionMinutes: 5 * 9 * 60,   // 1 working week (5 working days = 2700 minutes)
    name: 'Low'
  }
};

// Auto-close threshold: 5 working days (2700 working minutes)
const AUTO_CLOSE_WORKING_MINUTES = 5 * 9 * 60;

// Reopen threshold: 5 working days (2700 working minutes)
const REOPEN_WINDOW_WORKING_MINUTES = 5 * 9 * 60;

/**
 * Format Date to YYYY-MM-DD
 */
function formatDateKey(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Check if a date is a festival holiday
 */
function isHoliday(date) {
  const key = formatDateKey(date);
  return HOLIDAYS.includes(key);
}

/**
 * Check if a date falls on a weekend (Saturday = 6, Sunday = 0)
 */
function isWeekend(date) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}

/**
 * Check if date is a normal working day (Mon-Fri and not a holiday)
 */
function isWorkingDay(date) {
  return !isWeekend(date) && !isHoliday(date);
}

/**
 * Get date with specific hours and minutes
 */
function setTime(date, hours, minutes, seconds = 0, ms = 0) {
  const d = new Date(date);
  d.setHours(hours, minutes, seconds, ms);
  return d;
}

/**
 * Given any timestamp, if it falls outside working hours or non-working day,
 * roll forward to the start of the next working window (09:30 of next working day).
 */
function snapToWorkingTime(date) {
  let curr = new Date(date);

  while (true) {
    if (!isWorkingDay(curr)) {
      // Advance to next day at 09:30
      curr.setDate(curr.getDate() + 1);
      curr = setTime(curr, WORK_START_HOUR, WORK_START_MINUTE);
      continue;
    }

    const startToday = setTime(curr, WORK_START_HOUR, WORK_START_MINUTE);
    const endToday = setTime(curr, WORK_END_HOUR, WORK_END_MINUTE);

    if (curr < startToday) {
      // Before 9:30 AM today
      return startToday;
    }

    if (curr >= endToday) {
      // After 6:30 PM today -> roll to tomorrow 9:30 AM
      curr.setDate(curr.getDate() + 1);
      curr = setTime(curr, WORK_START_HOUR, WORK_START_MINUTE);
      continue;
    }

    // Within working hours of a working day
    return curr;
  }
}

/**
 * Add working minutes to a starting timestamp, strictly accounting for
 * 9:30 - 18:30 schedule, skipping weekends and holidays.
 */
function addWorkingMinutes(startDate, minutesToAdd) {
  let remaining = Math.round(minutesToAdd);
  let current = snapToWorkingTime(startDate);

  while (remaining > 0) {
    // Current is guaranteed to be within working hours of a valid working day
    const dayEnd = setTime(current, WORK_END_HOUR, WORK_END_MINUTE);
    const minutesLeftToday = (dayEnd.getTime() - current.getTime()) / (1000 * 60);

    if (remaining <= minutesLeftToday) {
      return new Date(current.getTime() + remaining * 60 * 1000);
    }

    // Consume remaining time today
    remaining -= minutesLeftToday;
    // Advance to next working day at 09:30
    current.setDate(current.getDate() + 1);
    current = snapToWorkingTime(setTime(current, WORK_START_HOUR, WORK_START_MINUTE));
  }

  return current;
}

/**
 * Calculate elapsed working minutes between two dates.
 */
function calculateWorkingMinutesBetween(start, end) {
  if (!start || !end || new Date(start) >= new Date(end)) return 0;

  let current = snapToWorkingTime(start);
  const targetEnd = new Date(end);
  let totalMinutes = 0;

  while (current < targetEnd) {
    if (!isWorkingDay(current)) {
      current.setDate(current.getDate() + 1);
      current = snapToWorkingTime(setTime(current, WORK_START_HOUR, WORK_START_MINUTE));
      continue;
    }

    const dayEnd = setTime(current, WORK_END_HOUR, WORK_END_MINUTE);
    const windowEnd = targetEnd < dayEnd ? targetEnd : dayEnd;

    if (windowEnd > current) {
      totalMinutes += (windowEnd.getTime() - current.getTime()) / (1000 * 60);
    }

    // Advance to next day at 9:30 AM
    current.setDate(current.getDate() + 1);
    current = snapToWorkingTime(setTime(current, WORK_START_HOUR, WORK_START_MINUTE));
  }

  return Math.round(totalMinutes);
}

/**
 * Calculate initial SLA due dates for a newly created ticket.
 */
function calculateSLADueDates(createdAt, priority) {
  const normPriority = (priority || 'MEDIUM').toUpperCase();
  const config = SLA_CONFIG[normPriority] || SLA_CONFIG.MEDIUM;

  const firstReplyDueAt = addWorkingMinutes(createdAt, config.firstReplyMinutes);
  const resolutionDueAt = addWorkingMinutes(createdAt, config.resolutionMinutes);

  return {
    firstReplyDueAt,
    resolutionDueAt,
    firstReplyTargetMinutes: config.firstReplyMinutes,
    resolutionTargetMinutes: config.resolutionMinutes
  };
}

/**
 * Handle Priority Change mid-lifecycle (Meera's meeting question):
 * "What happens to the timer if we change a ticket to urgent in the middle?"
 *
 * Implementation:
 * We calculate working minutes already elapsed from ticket creation (minus any paused waiting time).
 * Then remaining budget = NewPriorityTarget - ElapsedWorkingMinutes.
 * If elapsed >= target, the ticket breaches immediately.
 * Otherwise, the new due date is now + remaining working minutes.
 */
function recalculateSLAOnPriorityChange(ticket, newPriority, currentTime = new Date()) {
  const normPriority = newPriority.toUpperCase();
  const config = SLA_CONFIG[normPriority] || SLA_CONFIG.MEDIUM;

  const totalElapsedWorkingMinutes = calculateWorkingMinutesBetween(
    ticket.createdAt,
    currentTime
  ) - (ticket.totalPausedWorkingMinutes || 0);

  // First reply calculation
  let newFirstReplyDueAt = ticket.firstReplyDueAt;
  let isFirstReplyBreached = ticket.isFirstReplyBreached;

  if (!ticket.firstRepliedAt) {
    const remainingReplyMinutes = config.firstReplyMinutes - totalElapsedWorkingMinutes;
    if (remainingReplyMinutes <= 0) {
      newFirstReplyDueAt = currentTime;
      isFirstReplyBreached = true;
    } else {
      newFirstReplyDueAt = addWorkingMinutes(currentTime, remainingReplyMinutes);
      isFirstReplyBreached = false;
    }
  }

  // Resolution calculation
  let newResolutionDueAt = ticket.resolutionDueAt;
  let isResolutionBreached = ticket.isResolutionBreached;

  if (!ticket.resolvedAt) {
    const remainingResolutionMinutes = config.resolutionMinutes - totalElapsedWorkingMinutes;
    if (remainingResolutionMinutes <= 0) {
      newResolutionDueAt = currentTime;
      isResolutionBreached = true;
    } else {
      newResolutionDueAt = addWorkingMinutes(currentTime, remainingResolutionMinutes);
      isResolutionBreached = false;
    }
  }

  return {
    firstReplyDueAt: newFirstReplyDueAt,
    resolutionDueAt: newResolutionDueAt,
    isFirstReplyBreached,
    isResolutionBreached
  };
}

/**
 * When ticket resumes from WAITING_ON_CUSTOMER:
 * Adds the paused working duration to the SLA deadlines so Arvo is not penalized.
 */
function resumeSLAAfterCustomerWait(ticket, currentTime = new Date()) {
  if (!ticket.waitingCustomerStartedAt) {
    return {
      firstReplyDueAt: ticket.firstReplyDueAt,
      resolutionDueAt: ticket.resolutionDueAt,
      additionalPausedMinutes: 0
    };
  }

  const pausedWorkingMinutes = calculateWorkingMinutesBetween(
    ticket.waitingCustomerStartedAt,
    currentTime
  );

  const updatedFirstReplyDueAt = ticket.firstRepliedAt
    ? ticket.firstReplyDueAt
    : addWorkingMinutes(ticket.firstReplyDueAt, pausedWorkingMinutes);

  const updatedResolutionDueAt = addWorkingMinutes(
    ticket.resolutionDueAt,
    pausedWorkingMinutes
  );

  return {
    firstReplyDueAt: updatedFirstReplyDueAt,
    resolutionDueAt: updatedResolutionDueAt,
    additionalPausedMinutes: pausedWorkingMinutes
  };
}

/**
 * Check if a resolved ticket can be reopened.
 * Rule: Within about one working week (5 working days / 45 working hours).
 */
function canReopenTicket(resolvedAt, currentTime = new Date()) {
  if (!resolvedAt) return true;
  const elapsedWorkingMinutes = calculateWorkingMinutesBetween(resolvedAt, currentTime);
  return elapsedWorkingMinutes <= REOPEN_WINDOW_WORKING_MINUTES;
}

/**
 * Check if a ticket waiting on customer should be auto-closed.
 * Rule: Customer has not replied for about one working week (5 working days / 45 working hours).
 */
function shouldAutoClose(waitingCustomerStartedAt, currentTime = new Date()) {
  if (!waitingCustomerStartedAt) return false;
  const elapsedWorkingMinutes = calculateWorkingMinutesBetween(
    waitingCustomerStartedAt,
    currentTime
  );
  return elapsedWorkingMinutes >= AUTO_CLOSE_WORKING_MINUTES;
}

/**
 * Get comprehensive SLA health evaluation for a ticket
 */
function evaluateSLA(ticket, currentTime = new Date()) {
  const isWaiting = ticket.status === 'WAITING_ON_CUSTOMER';
  const isClosed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  // Reply SLA
  let replyStatus = 'PENDING';
  let replyTimeRemainingMinutes = 0;
  let replyIsBreached = ticket.isFirstReplyBreached;

  if (ticket.firstRepliedAt) {
    replyStatus = 'MET';
    replyIsBreached = new Date(ticket.firstRepliedAt) > new Date(ticket.firstReplyDueAt);
  } else if (!isClosed) {
    if (currentTime > new Date(ticket.firstReplyDueAt)) {
      replyStatus = 'BREACHED';
      replyIsBreached = true;
    } else {
      replyTimeRemainingMinutes = calculateWorkingMinutesBetween(currentTime, ticket.firstReplyDueAt);
      replyStatus = isWaiting ? 'PAUSED' : 'ACTIVE';
    }
  }

  // Resolution SLA
  let resolutionStatus = 'PENDING';
  let resolutionTimeRemainingMinutes = 0;
  let resolutionIsBreached = ticket.isResolutionBreached;

  if (ticket.resolvedAt) {
    resolutionStatus = 'MET';
    resolutionIsBreached = new Date(ticket.resolvedAt) > new Date(ticket.resolutionDueAt);
  } else if (!isClosed) {
    if (currentTime > new Date(ticket.resolutionDueAt)) {
      resolutionStatus = 'BREACHED';
      resolutionIsBreached = true;
    } else {
      resolutionTimeRemainingMinutes = calculateWorkingMinutesBetween(currentTime, ticket.resolutionDueAt);
      resolutionStatus = isWaiting ? 'PAUSED' : 'ACTIVE';
    }
  }

  return {
    isWaiting,
    isClosed,
    reply: {
      status: replyStatus,
      isBreached: replyIsBreached,
      dueAt: ticket.firstReplyDueAt,
      repliedAt: ticket.firstRepliedAt,
      remainingMinutes: replyTimeRemainingMinutes
    },
    resolution: {
      status: resolutionStatus,
      isBreached: resolutionIsBreached,
      dueAt: ticket.resolutionDueAt,
      resolvedAt: ticket.resolvedAt,
      remainingMinutes: resolutionTimeRemainingMinutes
    },
    isOverallBreached: replyIsBreached || resolutionIsBreached
  };
}

module.exports = {
  SLA_CONFIG,
  HOLIDAYS,
  isWorkingDay,
  isWeekend,
  isHoliday,
  snapToWorkingTime,
  addWorkingMinutes,
  calculateWorkingMinutesBetween,
  calculateSLADueDates,
  recalculateSLAOnPriorityChange,
  resumeSLAAfterCustomerWait,
  canReopenTicket,
  shouldAutoClose,
  evaluateSLA
};
