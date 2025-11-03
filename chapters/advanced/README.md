# Advanced Training Chapters

This folder will contain the advanced training content for LearnGit.space.

## Structure
- `novice/` - Contains all current chapters (Cadet Training path)
- `advanced/` - Will contain future advanced chapters (Commander Operations path)

## Future Advanced Content
When adding advanced chapters, they should be placed in this `chapters/advanced/` directory and linked appropriately in the main `index.html` file.

## Path Configuration
The JavaScript path system in `js/progress-tracker.js` will need to be updated to:
1. Change advanced missions from `path: 'novice'` to `path: 'advanced'`
2. Update the `paths.advanced.missions` array with the new advanced mission names
3. Update the `paths.advanced.totalPhases` count
4. Update chapter links in `index.html` to point to `chapters/advanced/` for advanced content

This structure allows for clean separation between novice and advanced training materials while maintaining the existing path selection system.