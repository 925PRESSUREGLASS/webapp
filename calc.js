// precisionCalc.js - iOS Safari Compatible Version
// Precise calculation engine using integer arithmetic for money
// All arrow functions and template literals removed for iOS compatibility

(function() {
'use strict';

// Constants
var CENTS_PER_DOLLAR = 100;
var MINUTES_PER_HOUR = 60;

// Precision helpers
var Money = {
// Convert dollars to cents (integers)
toCents: function(dollars) {
if (typeof dollars !== 'number' || !isFinite(dollars)) {
throw new Error('Invalid dollar amount: ' + dollars);
}
return Math.round(dollars * CENTS_PER_DOLLAR);
},

// Convert cents to dollars (float)
fromCents: function(cents) {
if (typeof cents !== 'number' || !isFinite(cents)) {
throw new Error('Invalid cents amount: ' + cents);
}
return cents / CENTS_PER_DOLLAR;
},

// Round to 2 decimals (float)
round: function(dollars) {
if (typeof dollars !== 'number' || !isFinite(dollars)) {
throw new Error('Invalid dollar amount in round: ' + dollars);
}
return Math.round(dollars * 100) / 100;
},

// Add multiple cents values safely
sumCents: function() {
var centsArray = Array.prototype.slice.call(arguments);
return centsArray.reduce(function(total, value) {
if (typeof value !== 'number' || !isFinite(value)) {
throw new Error('Invalid cents value in sum: ' + value);
}
return total + value;
}, 0);
},

// Multiply dollars by a factor, keeping cents accurate
multiplyDollars: function(dollars, factor) {
if (typeof dollars !== 'number' || typeof factor !== 'number') {
throw new Error('Invalid multiplyDollars inputs');
}
return Money.fromCents(
Math.round(dollars * factor * CENTS_PER_DOLLAR)
);
},

// Multiply cents by a factor
multiplyCents: function(cents, factor) {
if (typeof cents !== 'number' || typeof factor !== 'number') {
throw new Error('Invalid multiplyCents inputs');
}
return Math.round(cents * factor);
},

// Ensure result is at least minimum (dollars)
applyMinimumDollars: function(amountDollars, minimumDollars) {
var amountCents = Money.toCents(amountDollars);
var minimumCents = Money.toCents(minimumDollars);
var appliedCents = Money.applyMinimum(amountCents, minimumCents);
return Money.fromCents(appliedCents);
},

// Apply minimum charge
applyMinimum: function(amountCents, minimumCents) {
  return Math.max(amountCents, minimumCents);
}


};

// Time calculation helpers
var Time = {
// Convert hours to minutes
hoursToMinutes: function(hours) {
if (typeof hours !== 'number' || !isFinite(hours)) {
throw new Error('Invalid hours: ' + hours);
}
return Math.round(hours * MINUTES_PER_HOUR);
},

// Convert minutes to hours
minutesToHours: function(minutes) {
  if (typeof minutes !== 'number' || !isFinite(minutes)) {
    throw new Error('Invalid minutes: ' + minutes);
  }
  return minutes / MINUTES_PER_HOUR;
},

// Format time for display
formatHours: function(minutes) {
  var hours = this.minutesToHours(minutes);
  return hours.toFixed(2);
},

// Sum multiple time values (in minutes)
sum: function() {
  var times = Array.prototype.slice.call(arguments);
  return times.reduce(function(total, minutes) {
    if (typeof minutes !== 'number' || !isFinite(minutes)) {
      throw new Error('Invalid minutes in sum: ' + minutes);
    }
    return total + minutes;
  }, 0);
}
};

// Window calculation helpers
var WindowCalc = {
// Calculate time for a single window line
calculateLineMinutes: function(line, config) {
if (!line || !config) return 0;

// Base type data
var typeData = windowTypeMap[line.windowTypeId];
if (!typeData) return 0;

var baseInside = typeData.baseMinutesInside || 0;
var baseOutside = typeData.baseMinutesOutside || 0;

var insideMultiplier = config.insideMultiplier || 1;
var outsideMultiplier = config.outsideMultiplier || 1;

// Determine base time per pane
var minutesPerPane = 0;
if (line.inside) {
minutesPerPane += baseInside * insideMultiplier;
}
if (line.outside) {
minutesPerPane += baseOutside * outsideMultiplier;
}

// High reach and soil modifiers
var soilFactor = 1.0;
if (line.soilLevel === 'medium') soilFactor = 1.2;
else if (line.soilLevel === 'heavy') soilFactor = 1.4;

var accessFactor = 1.0;
if (line.highReach) accessFactor = 1.4;

var tintFactor = 1.0;
if (line.tintLevel === 'light') tintFactor = 1.05;
else if (line.tintLevel === 'heavy') tintFactor = 1.1;

var combinedFactor = soilFactor * accessFactor * tintFactor;

// Total minutes
var panes = line.panes || 0;
var totalMinutes = minutesPerPane * panes * combinedFactor;

// Return minutes
return totalMinutes;
},

// Calculate high reach time premium (portion of time that is high reach)
calculateHighReachMinutes: function(line, config) {
if (!line || !config) return 0;
if (!line.highReach) return 0;

// For simplicity, treat a fraction of outside time as high reach premium
var typeData = windowTypeMap[line.windowTypeId];
if (!typeData || !line.outside) return 0;

var baseOutside = typeData.baseMinutesOutside || 0;
var outsideMultiplier = config.outsideMultiplier || 1;
var minutesPerPane = baseOutside * outsideMultiplier;

var panes = line.panes || 0;
var soilFactor = 1.0;
if (line.soilLevel === 'medium') soilFactor = 1.2;
else if (line.soilLevel === 'heavy') soilFactor = 1.4;

var tintFactor = 1.0;
if (line.tintLevel === 'light') tintFactor = 1.05;
else if (line.tintLevel === 'heavy') tintFactor = 1.1;

var baseMinutes = minutesPerPane * panes * soilFactor * tintFactor;

// We assume high reach adds 40% extra on this portion
var extraMinutes = baseMinutes * 0.4;
return extraMinutes;
}
};

// Pressure calculation helpers
var PressureCalc = {
calculateLineMinutes: function(line) {
if (!line) return 0;

var surface = pressureSurfaceMap[line.surfaceId];
if (!surface) return 0;

// Base minutes per sqm
var mps = surface.minutesPerSqm || 0;
var area = line.areaSqm || 0;

// Soil factor
var soilFactor = 1.0;
if (line.soilLevel === 'medium') soilFactor = 1.25;
else if (line.soilLevel === 'heavy') soilFactor = 1.5;

// Access factor
var accessFactor = 1.0;
if (line.access === 'ladder') accessFactor = 1.2;
else if (line.access === 'highReach') accessFactor = 1.35;

var minutes = mps * area * soilFactor * accessFactor;
return minutes;
}
};

// Main calculator
var PrecisionCalc = {
calculate: function(state) {
if (!state) {
throw new Error('calculate(state) requires a state object');
}

// Extract config
var config = {
baseFee: parseFloat(state.baseFee) || 0,
hourlyRate: parseFloat(state.hourlyRate) || 0,
minimumJob: parseFloat(state.minimumJob) || 0,
highReachModifierPercent: parseFloat(state.highReachModifierPercent) || 0,
insideMultiplier: parseFloat(state.insideMultiplier) || 1,
outsideMultiplier: parseFloat(state.outsideMultiplier) || 1,
pressureHourlyRate: parseFloat(state.pressureHourlyRate) || 0,
setupBufferMinutes: parseFloat(state.setupBufferMinutes) || 0
};

// Initialize totals (in minutes and cents)
var windowsMinutes = 0;
var pressureMinutes = 0;
var highReachMinutes = 0;

// Windows
var i;
if (state.windowLines && state.windowLines.length) {
for (i = 0; i < state.windowLines.length; i++) {
var wLine = state.windowLines[i];
var m = WindowCalc.calculateLineMinutes(wLine, config);
var hrExtra = WindowCalc.calculateHighReachMinutes(wLine, config);

windowsMinutes += m;
highReachMinutes += hrExtra || 0;
}
}

// Pressure
if (state.pressureLines && state.pressureLines.length) {
for (i = 0; i < state.pressureLines.length; i++) {
var pLine = state.pressureLines[i];
var pm = PressureCalc.calculateLineMinutes(pLine);
pressureMinutes += pm;
}
}

// Travel/setup buffer
var setupMinutes = config.setupBufferMinutes || 0;

// Convert minutes to hours
var windowsHours = Time.minutesToHours(windowsMinutes);
var pressureHours = Time.minutesToHours(pressureMinutes);
var highReachHours = Time.minutesToHours(highReachMinutes);
var setupHours = Time.minutesToHours(setupMinutes);

// Convert hours to labour cost (cents)
var labourRateCents = Money.toCents(config.hourlyRate);
var pressureRateCents = Money.toCents(config.pressureHourlyRate || config.hourlyRate);

var windowsCostCents = Math.round(windowsHours * labourRateCents);
var pressureCostCents = Math.round(pressureHours * pressureRateCents);
var setupCostCents = Math.round(setupHours * labourRateCents);

// High reach modifier – percent of exterior pane cost (approximated using highReachHours)
var highReachModifierFactor = (config.highReachModifierPercent || 0) / 100;
var highReachCostCents = Math.round(
highReachHours * labourRateCents * highReachModifierFactor
);

// Base fee
var baseFeeCents = Money.toCents(config.baseFee);

// Sum up subtotal in cents
var subtotalCents =
baseFeeCents +
windowsCostCents +
pressureCostCents +
setupCostCents +
highReachCostCents;

// Apply minimum job
var minimumJobCents = Money.toCents(config.minimumJob);
var finalTotalCents = Money.applyMinimum(subtotalCents, minimumJobCents);

// Build result object
var result = {
money: {
baseFee: Money.fromCents(baseFeeCents),
windows: Money.fromCents(windowsCostCents),
pressure: Money.fromCents(pressureCostCents),
setup: Money.fromCents(setupCostCents),
highReach: Money.fromCents(highReachCostCents),
subtotal: Money.fromCents(subtotalCents),
minimumJob: config.minimumJob,
total: Money.fromCents(finalTotalCents)
},
time: {
windowsMinutes: windowsMinutes,
pressureMinutes: pressureMinutes,
highReachMinutes: highReachMinutes,
setupMinutes: setupMinutes,
windowsHours: windowsHours,
pressureHours: pressureHours,
highReachHours: highReachHours,
setupHours: setupHours,
totalMinutes: Time.sum(windowsMinutes, pressureMinutes, highReachMinutes, setupMinutes),
totalHours: Time.minutesToHours(
Time.sum(windowsMinutes, pressureMinutes, highReachMinutes, setupMinutes)
)
}
};

return result;
}
};

// Export globally
window.PrecisionCalc = PrecisionCalc;

})();