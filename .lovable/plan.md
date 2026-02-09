

## Make the Future Hora Date/Time Picker More Visible

The date/time picker button already exists (it's the "Live Now" button next to the Time-Travel Scrubber), but it blends in and isn't obviously a date picker. Here's the plan to make it prominent and clearly visible:

### Changes

**1. Move the picker outside the scrubber and make it a standalone, prominent button**

File: `src/components/vedic/AIVedicDashboard.tsx`
- Move the `HoraDateTimePicker` out of the Time-Travel Scrubber row and place it as its own clearly visible element below the Hora Watch header area, so it's always visible (even for free users if desired, or at minimum prominently placed for paid users)

**2. Restyle the picker button to be more prominent**

File: `src/components/vedic/HoraDateTimePicker.tsx`
- Make the trigger button larger with a more visible style (e.g., amber/gold border, bigger icon, clearer label like "Check Future Hora")
- Add a z-index to the `PopoverContent` to ensure it renders above the dark dashboard cards
- Ensure the popover has proper contrast against the dark theme background

### Technical Details

- In `AIVedicDashboard.tsx` (~line 296-300): Move `HoraDateTimePicker` to render as a standalone card/button below the Hora Watch title section, outside the scrubber container
- In `HoraDateTimePicker.tsx`:
  - Change the button label from "Live Now" to "Check Future Hora" with a larger calendar icon
  - Use a more prominent styling: solid border, slightly larger size, amber accent color
  - Add `z-50` to PopoverContent to fix any layering issues
  - Style the popover dropdown with dark background to match the dashboard theme
