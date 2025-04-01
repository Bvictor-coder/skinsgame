# Testing the Game Lifecycle Management Changes

Follow these steps to test the new game lifecycle management features.

## Preparation

1. Start the development server:
   ```
   cd client
   npm start
   ```

2. Open the application in a browser.

## Test Case 1: Enhanced Status Badge

1. Navigate to the Game Management page
2. Observe the new Enhanced Status Badges in the game list
3. Verify that:
   - The badge displays the correct status name
   - The color coding matches the status
   - Small size badges appear correctly in the table

## Test Case 2: Game Status Timeline

1. Navigate to the Game Management page
2. Expand a game's details by clicking on it
3. Scroll down to see the Game Status Timeline 
4. Verify that:
   - The timeline shows all possible statuses
   - The current status is highlighted
   - Past statuses are properly marked
   - Future statuses are displayed correctly
   - If the game has status history, it shows timestamps properly

## Test Case 3: Game Status Transitions

1. Navigate to the Game Management page
2. Expand a game that's not in its final state
3. Click on an action button to transition the game to a different status
4. Verify that:
   - The status change is applied immediately in the UI
   - The timeline updates to reflect the new status
   - The status history section shows the new transition
   - If you reload the page, the change persists

## Test Case 4: Game Finalization

1. Navigate to the Game Management page
2. Expand a game that's in 'completed' status
3. Make sure a CTP player is selected
4. Click the "Finalize Game" button
5. Verify that:
   - The game transitions to "Finalized" status
   - The status badge updates
   - The timeline shows finalization as complete
   - Any scores are locked (attempt to modify them to verify)

## Test Case 5: Invalid Transitions

1. Try to perform an invalid transition, such as:
   - Skipping a step in the lifecycle
   - Finalizing a game without setting a CTP player
2. Verify that:
   - The system prevents invalid transitions 
   - Appropriate error messages are displayed

## Test Case 6: Check Redux Integration

1. Open your browser developer tools
2. Navigate to the Redux DevTools tab (if you have the Redux DevTools extension)
3. Observe the actions dispatched when you:
   - Load the game list
   - Expand a game
   - Transition a game's status
4. Verify that:
   - The correct actions are dispatched
   - The state updates properly after transitions

## Test Case 7: Mobile View Testing

1. Open the application in responsive design mode in your browser
2. Resize to mobile dimensions
3. Navigate to the Game Management page
4. Test each of the above features again
5. Verify that:
   - All components render properly on small screens
   - The timeline is readable
   - Actions are easily clickable

## Issue Reporting

If you encounter any issues during testing, please document them with:
- The test case number
- The exact steps to reproduce
- The expected behavior
- The actual behavior
- Any error messages (including console errors)
- Screenshots if applicable

This will help us address any problems quickly before releasing to production.
