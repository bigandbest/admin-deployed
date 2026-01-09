# Individual Pincode Active/Inactive Toggle Feature

## Overview
Added the ability for admins to enable/disable individual pincodes within a delivery zone, providing granular control over delivery availability.

## Feature Details

### What Changed
Previously, admins could only activate/deactivate entire zones. Now they can:
- ✅ Toggle individual pincodes within a zone as active or inactive
- ✅ Set initial active status when adding new pincodes
- ✅ Edit pincode status at any time
- ✅ View pincode status in the table with a clear Active/Inactive label

### Use Cases
1. **Temporary Service Suspension**: Disable specific pincodes temporarily without removing them
2. **Gradual Rollout**: Add pincodes but keep them inactive until ready to serve
3. **Service Management**: Quickly disable problematic areas while maintaining zone structure
4. **Testing**: Add test pincodes in inactive state for validation

## Implementation

### File Modified
**File**: `/admin-deployed/src/Components/ZoneManagement/ZoneForm.jsx`

### Changes Made

#### 1. Added `is_active` Field to Pincode Form
```javascript
const pincodeForm = useForm({
  initialValues: {
    pincode: "",
    city: "",
    state: "",
    district: "",
    location_name: "",
    village: "",
    others: "",
    is_active: true,  // ✅ NEW: Default to active
  },
  // ...
});
```

#### 2. Added Toggle Function
```javascript
const handleTogglePincodeActive = (index) => {
  const updatedPincodes = [...pincodes];
  updatedPincodes[index] = {
    ...updatedPincodes[index],
    is_active: !updatedPincodes[index].is_active,
  };
  setPincodes(updatedPincodes);
};
```

#### 3. Updated Pincode Table
- Added "Status" column
- Added Switch component for each pincode
- Shows "Active" or "Inactive" label

#### 4. Added Status Control in Entry Form
- Switch to set initial status when adding pincodes
- Description: "Enable or disable this pincode for delivery"

## How to Use

### Adding a New Pincode with Status
1. Go to **Delivery Zones** page
2. Click **Edit** on any zone or **Add Zone**
3. Click **Add Pincode**
4. Fill in pincode details
5. Toggle **Active Pincode** switch (default: ON)
6. Click **Add Pincode**

### Toggling Existing Pincode Status
1. Go to **Delivery Zones** page
2. Click **Edit** on any zone
3. In the pincodes table, find the pincode
4. Toggle the **Status** switch
5. Click **Update Zone** to save

### Visual Indicators
- ✅ **Green Switch + "Active" label**: Pincode is enabled for delivery
- ❌ **Gray Switch + "Inactive" label**: Pincode is disabled for delivery

## Table Structure

The pincode table now shows:
| Pincode | Location | Village | District | City | State | Others | **Status** | Actions |
|---------|----------|---------|----------|------|-------|--------|------------|---------|
| 110001  | CP       | -       | Central  | Delhi| Delhi | -      | 🟢 Active  | ✏️ 🗑️   |
| 110002  | Kashmere | -       | North    | Delhi| Delhi | -      | ⚪ Inactive| ✏️ 🗑️   |

## Backend Compatibility

The `is_active` field is included in the pincode data sent to the backend:
```javascript
{
  pincode: "110001",
  city: "Delhi",
  state: "Delhi",
  district: "Central Delhi",
  location_name: "Connaught Place",
  village: "",
  others: "",
  is_active: true  // ✅ Sent to backend
}
```

## Notes

- **Default Behavior**: New pincodes are active by default
- **Zone-Level Control**: Zone's `is_active` status still controls the entire zone
- **Hierarchy**: If a zone is inactive, all its pincodes are effectively inactive regardless of individual status
- **Data Persistence**: Pincode status is saved when creating or updating zones
- **Backward Compatibility**: Existing pincodes without `is_active` field default to `true`

## Testing Checklist

- [x] Add new pincode with active status
- [x] Add new pincode with inactive status
- [x] Toggle existing pincode status
- [x] Edit pincode and verify status is preserved
- [x] Create zone with mixed active/inactive pincodes
- [x] Update zone and verify pincode statuses are saved
- [x] Verify table displays status correctly
- [x] Verify switch labels update correctly

## Benefits

1. **Granular Control**: Manage delivery availability at pincode level
2. **Flexibility**: No need to delete/re-add pincodes
3. **Better UX**: Clear visual indication of pincode status
4. **Efficient Management**: Quick toggle without form editing
5. **Data Preservation**: Keep pincode data even when temporarily disabled
