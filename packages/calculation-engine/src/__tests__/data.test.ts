/**
 * @tictacstick/calculation-engine - Data Tests
 * 
 * Tests for ported data structures from v1.x
 */

import { describe, it, expect } from 'vitest';
import {
  // Window types
  CORE_WINDOW_TYPES,
  EXTENDED_WINDOW_TYPES,
  ALL_WINDOW_TYPES,
  createWindowTypeMap,
  getWindowTypesByCategory,
  WINDOW_CATEGORY_LABELS,
  // Pressure surfaces
  CORE_PRESSURE_SURFACES,
  EXTENDED_PRESSURE_SURFACES,
  ALL_PRESSURE_SURFACES,
  createPressureSurfaceMap,
  getSurfacesByCategory,
  SURFACE_CATEGORY_LABELS,
  // Modifiers
  WINDOW_CONDITIONS,
  ACCESS_MODIFIERS,
  PRESSURE_CONDITIONS,
  TECHNIQUE_MODIFIERS,
  ALL_MODIFIERS,
  createModifierMap,
  getModifiersByCategory,
  calculateCombinedMultiplier,
  MODIFIER_CATEGORY_LABELS,
} from '../data';

describe('Window Types', () => {
  it('should have core window types', () => {
    expect(CORE_WINDOW_TYPES.length).toBeGreaterThan(0);
    expect(CORE_WINDOW_TYPES[0]).toHaveProperty('id');
    expect(CORE_WINDOW_TYPES[0]).toHaveProperty('label');
    expect(CORE_WINDOW_TYPES[0]).toHaveProperty('baseMinutesInside');
    expect(CORE_WINDOW_TYPES[0]).toHaveProperty('baseMinutesOutside');
  });

  it('should have extended window types', () => {
    expect(EXTENDED_WINDOW_TYPES.length).toBeGreaterThan(0);
    // Should have sliding windows in extended
    const slidingTypes = EXTENDED_WINDOW_TYPES.filter(t => t.category === 'sliding');
    expect(slidingTypes.length).toBeGreaterThan(0);
  });

  it('should combine all window types', () => {
    expect(ALL_WINDOW_TYPES.length).toBe(
      CORE_WINDOW_TYPES.length + EXTENDED_WINDOW_TYPES.length
    );
  });

  it('should create a lookup map', () => {
    const map = createWindowTypeMap();
    expect(map.size).toBe(ALL_WINDOW_TYPES.length);
    
    // Check a known type
    const std1 = map.get('std1');
    expect(std1).toBeDefined();
    expect(std1?.label).toBe('Standard 1x1 (small)');
  });

  it('should filter by category', () => {
    const doors = getWindowTypesByCategory('door');
    expect(doors.length).toBeGreaterThan(0);
    doors.forEach(d => expect(d.category).toBe('door'));
  });

  it('should have category labels', () => {
    expect(WINDOW_CATEGORY_LABELS).toHaveProperty('sliding');
    expect(WINDOW_CATEGORY_LABELS).toHaveProperty('door');
    expect(WINDOW_CATEGORY_LABELS).toHaveProperty('balustrade');
  });

  it('should have valid numeric values', () => {
    ALL_WINDOW_TYPES.forEach(type => {
      expect(type.baseMinutesInside).toBeGreaterThan(0);
      expect(type.baseMinutesOutside).toBeGreaterThan(0);
      if (type.basePrice) {
        expect(type.basePrice).toBeGreaterThan(0);
      }
    });
  });

  it('should have unique IDs', () => {
    const ids = ALL_WINDOW_TYPES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Pressure Surfaces', () => {
  it('should have core pressure surfaces', () => {
    expect(CORE_PRESSURE_SURFACES.length).toBeGreaterThan(0);
    expect(CORE_PRESSURE_SURFACES[0]).toHaveProperty('id');
    expect(CORE_PRESSURE_SURFACES[0]).toHaveProperty('label');
    expect(CORE_PRESSURE_SURFACES[0]).toHaveProperty('minutesPerSqm');
    expect(CORE_PRESSURE_SURFACES[0]).toHaveProperty('category');
  });

  it('should have extended pressure surfaces', () => {
    expect(EXTENDED_PRESSURE_SURFACES.length).toBeGreaterThan(0);
    // Should have various categories
    const categories = new Set(EXTENDED_PRESSURE_SURFACES.map(s => s.category));
    expect(categories.size).toBeGreaterThan(3);
  });

  it('should combine all pressure surfaces', () => {
    expect(ALL_PRESSURE_SURFACES.length).toBe(
      CORE_PRESSURE_SURFACES.length + EXTENDED_PRESSURE_SURFACES.length
    );
  });

  it('should create a lookup map', () => {
    const map = createPressureSurfaceMap();
    expect(map.size).toBe(ALL_PRESSURE_SURFACES.length);
    
    // Check a known surface
    const driveway = map.get('driveway');
    expect(driveway).toBeDefined();
    expect(driveway?.label).toBe('Concrete Driveway');
  });

  it('should filter by category', () => {
    const driveways = getSurfacesByCategory('driveway');
    expect(driveways.length).toBeGreaterThan(0);
    driveways.forEach(d => expect(d.category).toBe('driveway'));
  });

  it('should have category labels', () => {
    expect(SURFACE_CATEGORY_LABELS).toHaveProperty('driveway');
    expect(SURFACE_CATEGORY_LABELS).toHaveProperty('patio');
    expect(SURFACE_CATEGORY_LABELS).toHaveProperty('roof');
  });

  it('should have valid numeric values', () => {
    ALL_PRESSURE_SURFACES.forEach(surface => {
      expect(surface.minutesPerSqm).toBeGreaterThan(0);
      if (surface.baseRate) {
        expect(surface.baseRate).toBeGreaterThan(0);
      }
    });
  });

  it('should have unique IDs', () => {
    const ids = ALL_PRESSURE_SURFACES.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Modifiers', () => {
  it('should have window conditions', () => {
    expect(WINDOW_CONDITIONS.length).toBeGreaterThan(0);
    expect(WINDOW_CONDITIONS[0]).toHaveProperty('id');
    expect(WINDOW_CONDITIONS[0]).toHaveProperty('label');
    expect(WINDOW_CONDITIONS[0]).toHaveProperty('timeMultiplier');
    expect(WINDOW_CONDITIONS[0]).toHaveProperty('priceMultiplier');
  });

  it('should have access modifiers', () => {
    expect(ACCESS_MODIFIERS.length).toBeGreaterThan(0);
    // Should have height-related modifiers
    const heightMods = ACCESS_MODIFIERS.filter(m => m.category === 'height');
    expect(heightMods.length).toBeGreaterThan(0);
  });

  it('should have pressure conditions', () => {
    expect(PRESSURE_CONDITIONS.length).toBeGreaterThan(0);
    // Should have dirt level conditions
    const dirtConditions = PRESSURE_CONDITIONS.filter(c => c.category === 'dirt');
    expect(dirtConditions.length).toBeGreaterThan(0);
  });

  it('should have technique modifiers', () => {
    expect(TECHNIQUE_MODIFIERS.length).toBeGreaterThan(0);
    // Should have both window and pressure techniques
    const windowTech = TECHNIQUE_MODIFIERS.filter(t => t.category === 'window');
    const pressureTech = TECHNIQUE_MODIFIERS.filter(t => t.category === 'pressure');
    expect(windowTech.length).toBeGreaterThan(0);
    expect(pressureTech.length).toBeGreaterThan(0);
  });

  it('should combine all modifiers', () => {
    const expectedTotal =
      WINDOW_CONDITIONS.length +
      ACCESS_MODIFIERS.length +
      PRESSURE_CONDITIONS.length +
      TECHNIQUE_MODIFIERS.length;
    expect(ALL_MODIFIERS.length).toBe(expectedTotal);
  });

  it('should create a lookup map', () => {
    const map = createModifierMap();
    expect(map.size).toBe(ALL_MODIFIERS.length);
    
    // Check a known modifier
    const clean = map.get('clean');
    expect(clean).toBeDefined();
    expect(clean?.label).toBe('Clean / Light Soiling');
  });

  it('should filter by category', () => {
    const debris = getModifiersByCategory('debris');
    expect(debris.length).toBeGreaterThan(0);
    debris.forEach(d => expect(d.category).toBe('debris'));
  });

  it('should have category labels', () => {
    expect(MODIFIER_CATEGORY_LABELS).toHaveProperty('debris');
    expect(MODIFIER_CATEGORY_LABELS).toHaveProperty('height');
    expect(MODIFIER_CATEGORY_LABELS).toHaveProperty('pressure');
  });

  it('should have valid multiplier values', () => {
    ALL_MODIFIERS.forEach(mod => {
      expect(mod.timeMultiplier).toBeGreaterThan(0);
      expect(mod.priceMultiplier).toBeGreaterThan(0);
    });
  });

  it('should have unique IDs', () => {
    const ids = ALL_MODIFIERS.map(m => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should calculate combined multipliers correctly', () => {
    const map = createModifierMap();
    
    // No modifiers = 1.0
    expect(calculateCombinedMultiplier([], 'time', map)).toBe(1.0);
    expect(calculateCombinedMultiplier([], 'price', map)).toBe(1.0);
    
    // Single modifier
    const cleanMod = map.get('clean');
    if (cleanMod) {
      expect(calculateCombinedMultiplier(['clean'], 'time', map)).toBe(cleanMod.timeMultiplier);
      expect(calculateCombinedMultiplier(['clean'], 'price', map)).toBe(cleanMod.priceMultiplier);
    }
    
    // Multiple modifiers should multiply
    const heavyDust = map.get('heavy_dust');
    const ladderShort = map.get('ladder_short');
    if (heavyDust && ladderShort) {
      const expectedTime = heavyDust.timeMultiplier * ladderShort.timeMultiplier;
      expect(calculateCombinedMultiplier(['heavy_dust', 'ladder_short'], 'time', map)).toBe(expectedTime);
    }
  });

  it('should have recommended defaults', () => {
    // At least some modifiers should be marked as recommended
    const recommended = ALL_MODIFIERS.filter(m => m.recommended);
    expect(recommended.length).toBeGreaterThan(0);
  });
});

describe('Data Integrity', () => {
  it('should not have overlapping IDs across data types', () => {
    const windowIds = new Set(ALL_WINDOW_TYPES.map(t => t.id));
    const surfaceIds = new Set(ALL_PRESSURE_SURFACES.map(s => s.id));
    const modifierIds = new Set(ALL_MODIFIERS.map(m => m.id));
    
    // Check no overlaps (IDs should be unique across types)
    // This is optional but helps prevent bugs
    ALL_WINDOW_TYPES.forEach(t => {
      expect(surfaceIds.has(t.id)).toBe(false);
    });
    
    ALL_PRESSURE_SURFACES.forEach(s => {
      expect(windowIds.has(s.id)).toBe(false);
    });
  });

  it('should have reasonable time estimates', () => {
    // Window times should be between 1-15 minutes per pane
    ALL_WINDOW_TYPES.forEach(type => {
      expect(type.baseMinutesInside).toBeGreaterThanOrEqual(1);
      expect(type.baseMinutesInside).toBeLessThanOrEqual(15);
      expect(type.baseMinutesOutside).toBeGreaterThanOrEqual(1);
      expect(type.baseMinutesOutside).toBeLessThanOrEqual(15);
    });

    // Pressure times should be between 0.5-5 minutes per sqm
    ALL_PRESSURE_SURFACES.forEach(surface => {
      expect(surface.minutesPerSqm).toBeGreaterThanOrEqual(0.5);
      expect(surface.minutesPerSqm).toBeLessThanOrEqual(5);
    });

    // Multipliers should be between 0.5 and 3.0
    ALL_MODIFIERS.forEach(mod => {
      expect(mod.timeMultiplier).toBeGreaterThanOrEqual(0.5);
      expect(mod.timeMultiplier).toBeLessThanOrEqual(3.0);
      expect(mod.priceMultiplier).toBeGreaterThanOrEqual(0.5);
      expect(mod.priceMultiplier).toBeLessThanOrEqual(3.0);
    });
  });
});
