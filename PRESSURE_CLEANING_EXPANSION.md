# Pressure Cleaning Surface Types Expansion

**Date:** 2025-11-18
**Version:** 1.11.1
**Status:** ✅ Complete

---

## Summary

Massively expanded the pressure cleaning surface types from 25 to **60+ options**, organized into 11 categories. Added comprehensive specialty services, commercial cleaning options, and improved the pressure wizard with dynamic unit handling.

---

## New Surface Types Added (35+ additions)

### Fencing Additions (3)
- **Vinyl/PVC Fence** - Low pressure, quick clean
- **Screen Enclosure** - Mesh panels, detailed work
- **Chain Link Fence** - Wire mesh, straightforward

### Glass & Transparent Surfaces (4)
- **Glass Balustrade** - Frameless panels, both sides
- **Glass Pool Fence** - Pool safety glass
- **Outdoor Shower Screen** - Hard water stain removal
- **Skylight Cleaning** - Roof access, safety critical

### Outdoor Furniture & Features (4)
- **Outdoor Furniture Set** - Tables, chairs, detailed work
- **BBQ/Kitchen Area** - Grease buildup, degreaser required
- **Pergola/Gazebo** - Overhead work, safety considerations
- **Awning/Shade Sail** - Fabric or metal, low pressure for fabric

### Retaining Walls (3)
- **Concrete Retaining Wall** - Moss/algae buildup common
- **Stone Retaining Wall** - Many crevices, moderate pressure
- **Timber Retaining Wall** - Low pressure, avoid damage

### Additional Wall Types (2)
- **Wall Cladding** - Composite/vinyl, modern homes
- **Sandstone Feature Wall** - Very delicate, soft wash only

### Specialty Cleaning Services (13)
- **Wheelie Bin Cleaning** - Inside/out, sanitize
- **Caravan/RV Wash** - Low pressure, avoid seals/decals
- **Boat Cleaning** - Hull and deck, marine buildup
- **Trailer Cleaning** - Box or flatbed, often heavily soiled
- **Playground Equipment** - Child safety priority, gentle clean
- **Statues/Garden Features** - Very low pressure, delicate
- **Outdoor Steps/Stairs** - Anti-slip considerations
- **Balcony Floor** - Water runoff management
- **Asbestos Roof Survey** - Licensed professional required
- **Gutter Guard Cleaning** - Easier than open gutters

### Commercial Surfaces (4)
- **Shop Front/Facade** - After-hours work often needed
- **Signage Cleaning** - Avoid damage to graphics
- **Car Park/Parking Bay** - Large areas, oil stains
- **Graffiti Removal** - Chemical treatment, test area first

### Treatment Services (3)
- **Moss/Algae Treatment** - Chemical application add-on
- **Rust Stain Removal** - Acid-based cleaner, specialized
- **Concrete Sealing** - Post-clean sealing service

---

## File Changes

### 1. `pressure-surfaces-extended.js` (300 → 630 lines)
**Changes:**
- Added 35+ new surface type definitions
- Expanded from 25 to 60+ surface options
- Added new categories: glass, furniture, commercial
- Maintained ES5 compatibility throughout
- Each surface includes:
  - Unique ID and code
  - Category classification
  - Time calculations (per sqm, linear m, panel, item, etc.)
  - Base pricing rates
  - Detailed descriptions
  - Safety notes and recommendations

**New Categories:**
- `glass` - 4 surface types
- `furniture` - 4 surface types
- Commercial/specialty expanded significantly

### 2. `wizard.js` (563 → 640 lines)
**Major Enhancements:**

#### Grouped Surface Selection
- Surfaces now organized into 11 categories with optgroups
- Categories: Driveways & Car Parks, Patios & Outdoor Living, Decking, Pathways & Steps, Walls & Retaining, Fencing, Roofing & Gutters, Pool Areas, Glass Surfaces, Outdoor Furniture & Features, Specialty Services

#### Dynamic Quantity Labels
- Label changes based on selected surface type
- Supports multiple unit types:
  - **Area (m²)**: Standard surfaces (default)
  - **Linear metres**: Fencing, gutters
  - **Per panel**: Glass, balustrades
  - **Per bin**: Wheelie bins
  - **Per vehicle/trailer**: Caravans, boats
  - **Per set/item**: Furniture, features
  - **Per sign**: Commercial signage
  - **Per skylight**: Roof skylights

#### Smart Defaults
- Each unit type has appropriate default quantity
- Contextual hints guide user input
- Input updates automatically on surface selection

**Example Behavior:**
```
Select "Glass Balustrade" → Label: "Number of Panels", Hint: "How many panels?", Default: 4
Select "Wheelie Bin Cleaning" → Label: "Number of Bins", Hint: "How many bins to clean?", Default: 2
Select "Concrete Driveway" → Label: "Area (m²)", Hint: "Enter area in square metres", Default: 30
Select "Colorbond Fence" → Label: "Length (linear m)", Hint: "Enter length in linear metres", Default: 15
```

### 3. `CLAUDE.md` (Updated Documentation)
**Changes:**
- Updated pressure-surfaces-extended.js documentation
- Documented all 11 categories with surface types
- Added wizard integration details
- Updated line count (300 → 630 lines)
- Added comprehensive function reference

---

## Technical Implementation

### ES5 Compliance ✅
- All code uses `var`, `function()` syntax
- No arrow functions, template literals, or const/let
- Maintains iOS Safari 12+ compatibility

### Backward Compatibility ✅
- Falls back to basic surfaces if extended not loaded
- Existing quotes continue to work
- No breaking changes to data structure

### Safety Features ✅
- Critical warnings for delicate surfaces (limestone, sandstone)
- Safety notes for roof work, asbestos
- Pressure recommendations (low/soft wash)
- Chemical requirements noted

### Unit Flexibility ✅
- Supports 8+ different unit types
- Automatic label/hint updates
- Smart default quantities
- Consistent pricing calculations

---

## Categories & Surface Count

| Category | Surface Types | Examples |
|----------|---------------|----------|
| Driveways & Car Parks | 7 | Concrete, pavers, asphalt, carport, car park |
| Patios & Outdoor Living | 6 | Concrete, limestone, tiles, travertine, sandstone, balcony |
| Decking | 3 | Timber, composite, bamboo |
| Pathways & Steps | 4 | Concrete, pavers, gravel, outdoor stairs |
| Walls & Retaining | 9 | Brick, render, Hebel, limestone, cladding, retaining (3 types), sandstone |
| Fencing | 6 | Timber, Colorbond, brick, vinyl, screen, chain link |
| Roofing & Gutters | 5 | Tile, Colorbond, asbestos survey, gutter cleaning, gutter guard |
| Pool Areas | 3 | Pool paving, pool tiles, tennis court |
| Glass Surfaces | 4 | Balustrades, pool fence, shower screens, skylights |
| Outdoor Furniture & Features | 4 | Furniture sets, BBQ areas, pergolas, awnings |
| Specialty Services | 13 | Solar, bins, caravans, boats, trailers, playground, statues, shop fronts, signage, graffiti, moss treatment, rust removal, sealing |

**Total:** 60+ surface types

---

## Pricing Examples

### Standard Surfaces
- Concrete Driveway: $8/m², 1.4 min/m²
- Glass Balustrade: $8/panel, 4 min/panel
- Wheelie Bin: $12/bin, 5 min/bin

### Premium Surfaces
- Limestone Paving: $15/m², 2.5 min/m² (soft wash only)
- Pool Tiles (waterline): $15/linear m, 3 min/linear m
- Sandstone Feature: $14/m², 2.8 min/m² (very delicate)

### Specialty Services
- Caravan/RV: $80/vehicle, 60 min/vehicle
- Graffiti Removal: $25/m², 5 min/m²
- Concrete Sealing: $12/m², 2 min/m²
- Asbestos Survey: $150/survey (inspection only)

---

## User Experience Improvements

### Before
- 25 basic surface types
- Single flat dropdown list
- Generic "Area (sqm)" label
- Limited specialty services

### After
- 60+ comprehensive surface types
- Organized into 11 categories
- Dynamic quantity labels (8+ unit types)
- Context-appropriate hints
- Full specialty service coverage
- Commercial cleaning options
- Treatment services (moss, rust, sealing)

---

## Testing Checklist

- [x] All surfaces load in wizard dropdown
- [x] Categories display correctly with optgroups
- [x] Dynamic quantity labels update on selection
- [x] Default quantities appropriate for unit type
- [x] ES5 syntax validated (no const/let/arrows)
- [x] Backward compatibility maintained
- [x] No console errors
- [x] Server runs successfully
- [x] Code follows existing patterns

---

## Future Enhancements (Optional)

1. **Photo References**: Add example photos for each surface type
2. **Equipment Guide**: Link surfaces to recommended equipment
3. **Chemical Database**: Track chemicals needed per surface
4. **Seasonal Pricing**: Adjust rates for peak/off-peak seasons
5. **Job Templates**: Pre-configured packages (e.g., "Full Property Clean")
6. **Customer Education**: Surface care tips and maintenance schedules

---

## Files Modified

```
modified:   CLAUDE.md (documentation update)
modified:   pressure-surfaces-extended.js (300 → 630 lines, +35 surface types)
modified:   wizard.js (563 → 640 lines, +grouped selection, +dynamic labels)
```

**Total Lines Added:** ~400 lines of production code + documentation

---

## Perth-Specific Considerations

All surface types selected based on common Perth, WA requirements:
- ✅ Limestone (very common in Perth, soft material)
- ✅ Exposed aggregate (popular Perth driveways)
- ✅ Colorbond (ubiquitous in Perth homes)
- ✅ Sandstone features (Perth sandstone is soft)
- ✅ Pool areas (Perth climate, many pools)
- ✅ Solar panels (Perth sunshine capital)
- ✅ Outdoor living areas (alfresco lifestyle)

---

## Safety Highlights

Critical safety notes added for:
- 🔴 Asbestos roofs - Licensed contractor required
- 🟡 Limestone/Sandstone - Soft wash only, very delicate
- 🟡 Timber surfaces - Low pressure to avoid damage
- 🟡 Skylights - Roof access required
- 🟡 Playground equipment - Child safety priority
- 🟡 Caravan/RV - Avoid seals and decals
- 🟡 Solar panels - Pure water only, no chemicals

---

## Conclusion

This expansion transforms TicTacStick from a basic window/pressure cleaning quoting tool into a comprehensive cleaning services platform. The 60+ surface types cover virtually every cleaning scenario Gerard is likely to encounter in Perth, from residential driveways to commercial shop fronts to specialty services like boat cleaning and graffiti removal.

The dynamic wizard interface makes it easy to select the right surface type and enter the appropriate quantity, with context-sensitive labels and hints guiding the user. All while maintaining ES5 compatibility for iOS Safari 12+ devices used in the field.

**Status: Ready for production deployment** ✅
