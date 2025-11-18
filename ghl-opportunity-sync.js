// ghl-opportunity-sync.js - GoHighLevel Opportunity Sync Module
// Dependencies: ghl-config.js, ghl-client.js, ghl-contact-sync.js, app.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Map quote status to GHL pipeline stage
   */
  function mapQuoteStatusToStage(status) {
    var stageMap = {
      'draft': GHL_CONFIG.pipeline.stages.quote,
      'sent': GHL_CONFIG.pipeline.stages.quote,
      'accepted': GHL_CONFIG.pipeline.stages.won,
      'declined': GHL_CONFIG.pipeline.stages.lost,
      'follow-up': GHL_CONFIG.pipeline.stages.followUp,
      'pending': GHL_CONFIG.pipeline.stages.quote
    };

    return stageMap[status] || GHL_CONFIG.pipeline.stages.quote;
  }

  /**
   * Map GHL status to quote status
   */
  function mapStageToQuoteStatus(status) {
    if (status === 'won') return 'accepted';
    if (status === 'lost') return 'declined';
    if (status === 'abandoned') return 'declined';
    return 'sent';
  }

  /**
   * Get service types from quote
   */
  function getServiceTypes(quote) {
    var services = [];

    if (quote.windowLines && quote.windowLines.length > 0) {
      services.push('Window Cleaning');
    }

    if (quote.pressureLines && quote.pressureLines.length > 0) {
      services.push('Pressure Washing');
    }

    return services;
  }

  /**
   * Get primary service from quote
   */
  function getPrimaryService(quote) {
    var windowCount = quote.windowLines ? quote.windowLines.length : 0;
    var pressureCount = quote.pressureLines ? quote.pressureLines.length : 0;

    if (windowCount > pressureCount) return 'Window Cleaning';
    if (pressureCount > windowCount) return 'Pressure Washing';
    if (windowCount > 0) return 'Window Cleaning';
    return 'General Service';
  }

  /**
   * Map TicTacStick quote to GHL opportunity format
   */
  function mapQuoteToOpportunity(quote, client) {
    var serviceTypes = getServiceTypes(quote);
    var primaryService = getPrimaryService(quote);

    // Calculate total
    var total = 0;
    if (quote.totalIncGst) {
      total = parseFloat(quote.totalIncGst) || 0;
    } else if (quote.total) {
      total = parseFloat(quote.total) || 0;
    }

    var opportunity = {
      locationId: GHL_CONFIG.locationId,
      pipelineId: GHL_CONFIG.pipeline.id,
      pipelineStageId: mapQuoteStatusToStage(quote.status || 'draft'),
      name: quote.quoteTitle || ('Quote - ' + (client ? client.name : 'Unknown')),
      monetaryValue: Math.round(total * 100) / 100, // Round to 2 decimals
      status: quote.status === 'accepted' ? 'won' : (quote.status === 'declined' ? 'lost' : 'open'),
      contactId: client ? client.ghlId : null,
      source: 'TicTacStick'
    };

    // Add custom fields
    opportunity.customField = {};

    // Quote number (use ID if no quote number)
    var quoteNumber = quote.quoteNumber || quote.id || ('Q' + Date.now());
    opportunity.customField[GHL_CONFIG.customFields.quoteNumber] = quoteNumber;

    // Service types
    if (serviceTypes.length > 0) {
      opportunity.customField[GHL_CONFIG.customFields.serviceTypes] = serviceTypes.join(', ');
    }

    // Primary service
    opportunity.customField[GHL_CONFIG.customFields.primaryService] = primaryService;

    // Quote date
    var quoteDate = quote.dateCreated || new Date().toISOString();
    opportunity.customField[GHL_CONFIG.customFields.quoteDate] = quoteDate;

    // Quote total
    opportunity.customField[GHL_CONFIG.customFields.quoteTotal] = total.toString();

    return opportunity;
  }

  /**
   * Build quote description for notes
   */
  function buildQuoteDescription(quote) {
    var lines = [];

    lines.push('Quote Details:');
    lines.push('');

    // Service summary
    if (quote.windowLines && quote.windowLines.length > 0) {
      lines.push('Window Cleaning:');
      quote.windowLines.forEach(function(line) {
        var desc = '  - ' + (line.quantity || 0) + 'x ' + (line.type || 'Standard');
        if (line.highReach) desc += ' (High Reach)';
        lines.push(desc);
      });
      lines.push('');
    }

    if (quote.pressureLines && quote.pressureLines.length > 0) {
      lines.push('Pressure Washing:');
      quote.pressureLines.forEach(function(line) {
        var desc = '  - ' + (line.area || 0) + ' sqm ' + (line.surface || 'Concrete');
        lines.push(desc);
      });
      lines.push('');
    }

    // Pricing
    lines.push('Pricing:');
    if (quote.baseFee) {
      lines.push('  Base Fee: $' + quote.baseFee);
    }
    if (quote.hourlyRate) {
      lines.push('  Hourly Rate: $' + quote.hourlyRate + '/hr');
    }
    if (quote.totalExGst) {
      lines.push('  Subtotal: $' + quote.totalExGst);
    }
    if (quote.totalIncGst) {
      lines.push('  Total (inc GST): $' + quote.totalIncGst);
    }

    // Notes
    if (quote.clientNotes) {
      lines.push('');
      lines.push('Client Notes:');
      lines.push(quote.clientNotes);
    }

    return lines.join('\n');
  }

  /**
   * Create opportunity in GHL
   */
  function createOpportunity(quote, client, callback) {
    if (!GHL_CONFIG.features.opportunitySync) {
      if (callback) callback(new Error('Opportunity sync disabled'));
      return;
    }

    // Ensure client exists in GHL first
    if (!client || !client.ghlId) {
      console.log('[GHL-OPP-SYNC] Client has no GHL ID, syncing client first...');

      if (client && window.GHLContactSync) {
        window.GHLContactSync.syncClient(client, function(error) {
          if (error) {
            console.error('[GHL-OPP-SYNC] Failed to sync client:', error);
            if (callback) callback(error);
            return;
          }

          // Now create opportunity
          createOpportunity(quote, client, callback);
        });
      } else {
        if (callback) callback(new Error('No client provided'));
      }
      return;
    }

    var oppData = mapQuoteToOpportunity(quote, client);

    window.GHLClient.makeRequest('POST', '/opportunities/', oppData, function(error, response) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Failed to create opportunity:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-OPP-SYNC] Opportunity created:', response.opportunity.id);

      // Store GHL opportunity ID with quote
      quote.ghlOpportunityId = response.opportunity.id;
      quote.lastSync = new Date().toISOString();

      // Add quote description as note
      var description = buildQuoteDescription(quote);
      window.GHLContactSync.addNote(client, description, function(noteError) {
        if (noteError) {
          console.warn('[GHL-OPP-SYNC] Failed to add note:', noteError);
        }

        if (callback) callback(null, response.opportunity);
      });
    });
  }

  /**
   * Update opportunity in GHL
   */
  function updateOpportunity(quote, client, callback) {
    if (!quote.ghlOpportunityId) {
      console.error('[GHL-OPP-SYNC] Quote has no GHL opportunity ID');
      if (callback) callback(new Error('No GHL opportunity ID'));
      return;
    }

    var oppData = mapQuoteToOpportunity(quote, client);
    var endpoint = '/opportunities/' + quote.ghlOpportunityId;

    window.GHLClient.makeRequest('PUT', endpoint, oppData, function(error, response) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Failed to update opportunity:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-OPP-SYNC] Opportunity updated:', quote.ghlOpportunityId);

      quote.lastSync = new Date().toISOString();

      if (callback) callback(null, response.opportunity);
    });
  }

  /**
   * Update opportunity status
   */
  function updateOpportunityStatus(quote, newStatus, callback) {
    if (!quote.ghlOpportunityId) {
      if (callback) callback(new Error('No GHL opportunity ID'));
      return;
    }

    var endpoint = '/opportunities/' + quote.ghlOpportunityId + '/status';
    var statusData = {
      status: newStatus
    };

    window.GHLClient.makeRequest('PUT', endpoint, statusData, function(error, response) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Failed to update status:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-OPP-SYNC] Opportunity status updated:', newStatus);

      if (callback) callback(null, response);
    });
  }

  /**
   * Delete opportunity from GHL
   */
  function deleteOpportunity(quote, callback) {
    if (!quote.ghlOpportunityId) {
      if (callback) callback(new Error('No GHL opportunity ID'));
      return;
    }

    var endpoint = '/opportunities/' + quote.ghlOpportunityId;

    window.GHLClient.makeRequest('DELETE', endpoint, null, function(error, response) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Failed to delete opportunity:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-OPP-SYNC] Opportunity deleted:', quote.ghlOpportunityId);

      // Remove GHL ID from quote
      quote.ghlOpportunityId = null;
      quote.lastSync = new Date().toISOString();

      if (callback) callback(null, response);
    });
  }

  /**
   * Sync quote with GHL
   * Creates if doesn't exist, updates if exists
   */
  function syncQuote(quote, client, callback) {
    if (!window.GHLClient.isConfigured()) {
      if (callback) callback(new Error('GHL not configured'));
      return;
    }

    if (quote.ghlOpportunityId) {
      // Update existing
      updateOpportunity(quote, client, callback);
    } else {
      // Create new
      createOpportunity(quote, client, callback);
    }
  }

  /**
   * Sync all quotes
   */
  function syncAllQuotes(callback) {
    // Get all saved quotes from storage
    var quotesJson = localStorage.getItem('tictacstick_saved_quotes_v1');
    if (!quotesJson) {
      console.log('[GHL-OPP-SYNC] No saved quotes found');
      if (callback) callback(null, { synced: 0, failed: 0, total: 0 });
      return;
    }

    var quotes = [];
    try {
      quotes = JSON.parse(quotesJson);
    } catch (e) {
      console.error('[GHL-OPP-SYNC] Failed to parse quotes:', e);
      if (callback) callback(e);
      return;
    }

    var synced = 0;
    var failed = 0;
    var total = quotes.length;

    console.log('[GHL-OPP-SYNC] Syncing', total, 'quotes to GHL...');

    if (total === 0) {
      if (callback) callback(null, { synced: 0, failed: 0, total: 0 });
      return;
    }

    function syncNext(index) {
      if (index >= total) {
        console.log('[GHL-OPP-SYNC] Sync complete:', synced, 'synced,', failed, 'failed');
        window.GHLConfig.updateLastSync('opportunities');
        if (callback) callback(null, { synced: synced, failed: failed, total: total });
        return;
      }

      var quote = quotes[index];

      // Try to find client
      var client = null;
      if (quote.clientName && window.ClientDatabase) {
        var clients = window.ClientDatabase.searchClients(quote.clientName);
        if (clients && clients.length > 0) {
          client = clients[0];
        }
      }

      syncQuote(quote, client, function(error) {
        if (error) {
          failed++;
          console.error('[GHL-OPP-SYNC] Failed to sync quote:', quote.quoteTitle || quote.id);
        } else {
          synced++;

          // Update quote in storage
          quotes[index] = quote;
        }

        // Continue with next (rate limiting delay)
        setTimeout(function() {
          syncNext(index + 1);
        }, 500);
      });
    }

    syncNext(0);

    // Save updated quotes back to storage after sync completes
    setTimeout(function() {
      try {
        localStorage.setItem('tictacstick_saved_quotes_v1', JSON.stringify(quotes));
      } catch (e) {
        console.error('[GHL-OPP-SYNC] Failed to save updated quotes:', e);
      }
    }, (total * 500) + 1000);
  }

  /**
   * Add follow-up task for quote
   */
  function addFollowUpTask(quote, client, taskDetails, callback) {
    if (!client || !client.ghlId) {
      if (callback) callback(new Error('No client GHL ID'));
      return;
    }

    var taskData = {
      title: taskDetails.title || 'Follow up on quote',
      body: taskDetails.body || '',
      contactId: client.ghlId,
      dueDate: taskDetails.dueDate || null,
      completed: false
    };

    window.GHLClient.makeRequest('POST', '/tasks/', taskData, function(error, response) {
      if (error) {
        console.error('[GHL-OPP-SYNC] Failed to create task:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-OPP-SYNC] Follow-up task created');
      if (callback) callback(null, response.task);
    });
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlOpportunitySync', {
      createOpportunity: createOpportunity,
      updateOpportunity: updateOpportunity,
      updateOpportunityStatus: updateOpportunityStatus,
      deleteOpportunity: deleteOpportunity,
      syncQuote: syncQuote,
      syncAllQuotes: syncAllQuotes,
      addFollowUpTask: addFollowUpTask
    });
  }

  // Make globally available
  window.GHLOpportunitySync = {
    createOpportunity: createOpportunity,
    updateOpportunity: updateOpportunity,
    updateOpportunityStatus: updateOpportunityStatus,
    deleteOpportunity: deleteOpportunity,
    syncQuote: syncQuote,
    syncAllQuotes: syncAllQuotes,
    addFollowUpTask: addFollowUpTask
  };

  console.log('[GHL-OPP-SYNC] Initialized');
})();
