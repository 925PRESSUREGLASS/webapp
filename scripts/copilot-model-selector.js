#!/usr/bin/env node
// scripts/copilot-model-selector.js
// Recommends the best Copilot model based on task type
// Usage: node scripts/copilot-model-selector.js "your task description"
//    or: npm run model "your task description"

var MODELS = {
  'claude-sonnet-4': {
    name: 'Claude Sonnet 4',
    id: 'claude-sonnet-4',
    bestFor: ['daily coding', 'tests', 'docs', 'quick fixes', 'ES5 code', 'small features'],
    speed: 'fast',
    cost: 'medium',
    notes: 'Best default for TicTacStick - understands ES5/IIFE patterns well'
  },
  'claude-opus-4': {
    name: 'Claude Opus 4',
    id: 'claude-opus-4',
    bestFor: ['complex features', 'refactoring', 'architecture', 'multi-file changes', 'integrations'],
    speed: 'slower',
    cost: 'high',
    notes: 'Use for major features like email integration, contract system'
  },
  'gpt-4o': {
    name: 'GPT-4o',
    id: 'gpt-4o',
    bestFor: ['general coding', 'quick answers', 'explanations', 'brainstorming'],
    speed: 'fast',
    cost: 'medium',
    notes: 'Good for quick questions, may need ES5 reminders'
  },
  'gpt-4.1': {
    name: 'GPT-4.1',
    id: 'gpt-4.1',
    bestFor: ['instruction following', 'structured output', 'API work'],
    speed: 'fast',
    cost: 'medium',
    notes: 'Good at following specific instructions'
  },
  'o3': {
    name: 'o3 (Reasoning)',
    id: 'o3',
    bestFor: ['complex debugging', 'algorithm design', 'logic problems', 'race conditions'],
    speed: 'slow',
    cost: 'high',
    notes: 'Use for tricky bugs like service worker issues'
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    id: 'gemini-2.5-pro',
    bestFor: ['codebase analysis', 'explanations', 'screenshot analysis', 'long context'],
    speed: 'fast',
    cost: 'medium',
    notes: '1M token context - good for analyzing entire codebase'
  }
};

// Keywords mapped to recommended models
var TASK_KEYWORDS = {
  // Simple tasks → Claude Sonnet 4 (default)
  'fix': 'claude-sonnet-4',
  'bug': 'claude-sonnet-4',
  'typo': 'claude-sonnet-4',
  'style': 'claude-sonnet-4',
  'css': 'claude-sonnet-4',
  'test': 'claude-sonnet-4',
  'spec': 'claude-sonnet-4',
  'docs': 'claude-sonnet-4',
  'document': 'claude-sonnet-4',
  'changelog': 'claude-sonnet-4',
  'readme': 'claude-sonnet-4',
  'comment': 'claude-sonnet-4',
  'cleanup': 'claude-sonnet-4',
  'lint': 'claude-sonnet-4',
  'format': 'claude-sonnet-4',
  'update': 'claude-sonnet-4',
  'add button': 'claude-sonnet-4',
  'add field': 'claude-sonnet-4',
  'validation': 'claude-sonnet-4',
  
  // Complex tasks → Claude Opus 4
  'feature': 'claude-opus-4',
  'implement': 'claude-opus-4',
  'integration': 'claude-opus-4',
  'integrate': 'claude-opus-4',
  'refactor': 'claude-opus-4',
  'rewrite': 'claude-opus-4',
  'architecture': 'claude-opus-4',
  'design': 'claude-opus-4',
  'migration': 'claude-opus-4',
  'migrate': 'claude-opus-4',
  'system': 'claude-opus-4',
  'module': 'claude-opus-4',
  'api': 'claude-opus-4',
  'email': 'claude-opus-4',
  'contract': 'claude-opus-4',
  'invoice': 'claude-opus-4',
  'wizard': 'claude-opus-4',
  'dashboard': 'claude-opus-4',
  'analytics': 'claude-opus-4',
  
  // Reasoning tasks → o3
  'debug': 'o3',
  'diagnose': 'o3',
  'algorithm': 'o3',
  'optimize': 'o3',
  'performance': 'o3',
  'race condition': 'o3',
  'async': 'o3',
  'service worker': 'o3',
  'memory leak': 'o3',
  'deadlock': 'o3',
  
  // Analysis tasks → Gemini
  'explain': 'gemini-2.5-pro',
  'analyze': 'gemini-2.5-pro',
  'summarize': 'gemini-2.5-pro',
  'summary': 'gemini-2.5-pro',
  'overview': 'gemini-2.5-pro',
  'screenshot': 'gemini-2.5-pro',
  'image': 'gemini-2.5-pro',
  'describe': 'gemini-2.5-pro',
  'what does': 'gemini-2.5-pro',
  'how does': 'gemini-2.5-pro'
};

// Complexity indicators that upgrade the model
var COMPLEXITY_UPGRADES = [
  'across files',
  'multiple files',
  'entire',
  'complete',
  'full',
  'comprehensive',
  'major',
  'complex',
  'difficult',
  'tricky'
];

function recommendModel(taskDescription) {
  var task = taskDescription.toLowerCase();
  var recommended = 'claude-sonnet-4'; // default
  var matchedKeyword = 'default';
  var confidence = 'medium';
  
  // Check for keyword matches
  var keywords = Object.keys(TASK_KEYWORDS);
  for (var i = 0; i < keywords.length; i++) {
    var keyword = keywords[i];
    if (task.indexOf(keyword) !== -1) {
      recommended = TASK_KEYWORDS[keyword];
      matchedKeyword = keyword;
      confidence = 'high';
      break;
    }
  }
  
  // Check for complexity indicators that might upgrade the model
  var hasComplexity = COMPLEXITY_UPGRADES.some(function(indicator) {
    return task.indexOf(indicator) !== -1;
  });
  
  if (hasComplexity && recommended === 'claude-sonnet-4') {
    recommended = 'claude-opus-4';
    confidence = 'medium';
  }
  
  return {
    model: recommended,
    info: MODELS[recommended],
    matchedKeyword: matchedKeyword,
    confidence: confidence
  };
}

function printModels() {
  console.log('\nAvailable Models:\n');
  Object.keys(MODELS).forEach(function(key) {
    var model = MODELS[key];
    console.log('  ' + model.name);
    console.log('    ID: ' + model.id);
    console.log('    Speed: ' + model.speed + ' | Cost: ' + model.cost);
    console.log('    Best for: ' + model.bestFor.join(', '));
    console.log('    Note: ' + model.notes);
    console.log('');
  });
}

function printUsage() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           Copilot Model Selector for TicTacStick             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/copilot-model-selector.js "<task description>"');
  console.log('  npm run model "<task description>"');
  console.log('');
  console.log('Examples:');
  console.log('  npm run model "fix button styling"');
  console.log('  npm run model "add email integration feature"');
  console.log('  npm run model "debug service worker issue"');
  console.log('  npm run model "explain the contract system"');
  console.log('');
  console.log('Flags:');
  console.log('  --list, -l    Show all available models');
  console.log('  --help, -h    Show this help message');
}

function main() {
  var args = process.argv.slice(2);
  
  // Handle flags
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    return;
  }
  
  if (args[0] === '--list' || args[0] === '-l') {
    printModels();
    return;
  }
  
  var task = args.join(' ');
  var result = recommendModel(task);
  
  console.log('');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ Task: ' + task.slice(0, 53).padEnd(53) + ' │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ Recommended: ' + result.info.name.padEnd(47) + ' │');
  console.log('│ Confidence:  ' + result.confidence.padEnd(47) + ' │');
  console.log('│ Matched:     ' + result.matchedKeyword.padEnd(47) + ' │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ Speed: ' + result.info.speed.padEnd(10) + ' Cost: ' + result.info.cost.padEnd(33) + ' │');
  console.log('│ ' + result.info.notes.slice(0, 59).padEnd(59) + ' │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('In VS Code Copilot Chat, select: ' + result.info.name);
  console.log('');
}

main();
