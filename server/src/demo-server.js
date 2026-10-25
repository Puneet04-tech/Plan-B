#!/usr/bin/env node

console.log('Plan B Event Planning Assistant - Backend API Demo');
console.log('='.repeat(60));

const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Mock budget engine
const budgetEngine = {
  generatePlan: (eventType, guestCount, totalBudget) => {
    return {
      categories: {
        venue: Math.round(totalBudget * 0.35),
        catering: Math.round(totalBudget * 0.25),
        decor: Math.round(totalBudget * 0.15),
        photography: Math.round(totalBudget * 0.12),
        entertainment: Math.round(totalBudget * 0.1),
        misc: totalBudget - Math.round(totalBudget * 0.87)
      },
      totalBudget,
      guestCount,
      perGuestTotal: totalBudget / guestCount,
      realismCheck: {
        isRealistic: true,
        warnings: guestCount > 200 ? ['Consider larger venue'] : [],
        suggestions: ['Add contingency fund']
      },
      contingency: Math.round(totalBudget * 0.05)
    };
  }
};

// Mock timeline engine
const timelineEngine = {
  scheduleEvent: (eventType, eventDate, guestCount, totalBudget) => {
    const days = eventType === 'wedding' ? 14 : eventType === 'birthday' ? 7 : 10;
    const tasks = [
      { id: 'venue_booking', name: 'Book Venue', duration: 30, startDate: new Date(eventDate.getTime() - days * 24 * 60 * 60 * 1000) },
      { id: 'catering_selection', name: 'Select Caterer', duration: 14, startDate: new Date(eventDate.getTime() - days * 24 * 60 * 60 * 1000) },
      { id: 'photography_booking', name: 'Book Photographer', duration: 7, startDate: new Date(eventDate.getTime() - days * 24 * 60 * 60 * 1000) },
      { id: 'entertainment_booking', name: 'Book Entertainment', duration: 7, startDate: new Date(eventDate.getTime() - days * 24 * 60 * 60 * 1000) },
      { id: 'event_day', name: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Day`, duration: 1, startDate: eventDate }
    ];
    
    return {
      tasks,
      eventDate,
      totalDuration: days,
      criticalPath: ['event_day'],
      warnings: []
    };
  }
};

// Mock disruption engine
const disruptionEngine = {
  getDisruptions: () => [
    { type: 'venue_cancelled', description: 'Venue cancelled', severity: 'critical', multiplier: 1.5 },
    { type: 'budget_cut', description: 'Budget cut 20%', severity: 'medium', multiplier: 0.8 },
    { type: 'guest_count_increase', description: 'Guests +30%', severity: 'high', multiplier: 1.3 }
  ],
  
  applyDisruption: (eventType, guestCount, totalBudget, originalBudget, originalTimeline, disruption) => {
    let newBudget = totalBudget;
    let changes = [];
    
    switch (disruption.type) {
      case 'venue_cancelled':
        newBudget = totalBudget * 1.5;
        changes.push({ taskId: 'venue_booking', changeType: 'reorder', daysChanged: 14, description: 'Need backup venue' });
        break;
      case 'budget_cut':
        newBudget = totalBudget * 0.8;
        changes.push({ taskId: 'entertainment', changeType: 'delay', daysChanged: -7, description: 'Cut back on entertainment' });
        break;
      case 'guest_count_increase':
        newBudget = guestCount * 3000;
        changes.push({ taskId: 'catering_menu', changeType: 'reorder', daysChanged: 3, description: 'Larger menu needed' });
        break;
    }
    
    return {
      disruption,
      budgetDiff: {
        before: originalBudget,
        after: newBudget,
        change: newBudget - originalBudget
      },
      timelineDiff: changes,
      recommendations: [
        'Have backup venue ready',
        'Review all vendor contracts',
        'Update guest communications'
      ]
    };
  }
};

// API Endpoints

app.post('/api/plan', (req, res) => {
  try {
    const { eventType, eventDate, city, guestCount, totalBudget, theme } = req.body;
    
    const budgetPlan = budgetEngine.generatePlan(eventType, guestCount, totalBudget);
    const timeline = timelineEngine.scheduleEvent(
      eventType, 
      new Date(eventDate), 
      guestCount, 
      totalBudget
    );
    
    const plan = {
      eventSetup: { eventType, eventDate, city, guestCount, totalBudget, theme },
      budget: budgetPlan,
      timeline,
      personalizedIdeas: {
        themes: [{ name: 'Classic Elegance', description: 'Timeless style', estimatedCost: 50000, suitability: 0.8 }],
        decor: [{ name: 'Floral Arrangement', description: 'Elegant flowers', estimatedCost: 25000, setupTime: '2-3 hours' }],
        menu: [{ name: 'Three-Course Dinner', description: 'Multi-course meal', perPersonCost: 2500, dietaryOptions: ['Vegetarian', 'Non-Vegetarian'] }],
        activities: [{ name: 'Live Music', description: 'Wedding band', duration: '3 hours', estimatedCost: 40000 }]
      },
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: plan,
      message: 'Event plan generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.post('/api/disrupt', (req, res) => {
  try {
    const { eventType, guestCount, totalBudget, disruptionType } = req.body;
    
    const disruption = disruptionEngine.getDisruptions().find(d => d.type === disruptionType);
    if (!disruption) {
      return res.status(400).json({
        success: false,
        error: 'Invalid disruption type'
      });
    }
    
    const originalBudget = totalBudget;
    const originalTimeline = timelineEngine.scheduleEvent(
      eventType,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      guestCount,
      totalBudget
    );
    
    const result = disruptionEngine.applyDisruption(
      eventType,
      guestCount,
      totalBudget,
      originalBudget,
      originalTimeline,
      disruption
    );
    
    res.json({
      success: true,
      data: result,
      message: `Disruption '${disruptionType}' applied successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      budgetEngine: 'active',
      timelineEngine: 'active',
      disruptionEngine: 'active',
      api: 'active'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Plan B API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
