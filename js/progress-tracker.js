// Progress Tracker for LearnGit.space
// Tracks chapter completion and displays progress

const ProgressTracker = {
    // Storage keys
    STORAGE_KEY: 'learngit_progress',
    PATH_KEY: 'learngit_selected_path',
    
    // Mission structure
    missions: {
        'mission-briefing': { phases: 1, section: 'Pre-Launch', path: 'novice' },
        'git-basics': { phases: 10, section: 'Phase 1: Launch Sequence', path: 'novice' },
        'branches': { phases: 8, section: 'Phase 2: Orbital Maneuvers', path: 'novice' },
        'advanced': { phases: 7, section: 'Phase 3: Deep Space Operations', path: 'novice' },
        'collaboration': { phases: 6, section: 'Phase 4: Multi-Crew Missions', path: 'novice' },
        'beyond': { phases: 3, section: 'Phase 5: Beyond the Solar System', path: 'novice' }
    },

    // Path definitions
    paths: {
        novice: {
            name: 'Cadet Training',
            missions: ['mission-briefing', 'git-basics', 'branches', 'advanced', 'collaboration', 'beyond'],
            totalPhases: 35  // 1 + 10 + 8 + 7 + 6 + 3 = 35
        },
        advanced: {
            name: 'Commander Operations', 
            missions: [],  // Will be populated when advanced content is added
            totalPhases: 0
        }
    },
    
    // Initialize progress tracker
    init() {
        this.loadProgress();
        this.setupScrollDetection();
        this.updateAllUI();
    },
    
    // Load progress from localStorage
    loadProgress() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        this.progress = stored ? JSON.parse(stored) : {};
    },
    
    // Save progress to localStorage
    saveProgress() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.progress));
    },
    
    // Mark a chapter as complete
    completeChapter(mission, phase) {
        if (!this.progress[mission]) {
            this.progress[mission] = [];
        }
        if (!this.progress[mission].includes(phase)) {
            this.progress[mission].push(phase);
            this.saveProgress();
            this.showCompletionAnimation(mission, phase);
            this.updateAllUI();
        }
    },
    
    // Check if chapter is complete
    isChapterComplete(mission, phase) {
        return this.progress[mission] && this.progress[mission].includes(phase);
    },
    
    // Check if mission is complete
    isMissionComplete(mission) {
        if (!this.missions[mission]) return false;
        const totalPhases = this.missions[mission].phases;
        const completedPhases = this.progress[mission] ? this.progress[mission].length : 0;
        return completedPhases >= totalPhases;
    },
    
    // Get mission completion percentage
    getMissionProgress(mission) {
        if (!this.missions[mission]) return 0;
        const totalPhases = this.missions[mission].phases;
        const completedPhases = this.progress[mission] ? this.progress[mission].length : 0;
        return Math.round((completedPhases / totalPhases) * 100);
    },
    
    // Get overall progress
    getOverallProgress() {
        let totalPhases = 0;
        let completedPhases = 0;
        
        for (const [mission, data] of Object.entries(this.missions)) {
            totalPhases += data.phases;
            completedPhases += this.progress[mission] ? this.progress[mission].length : 0;
        }
        
        return {
            completed: completedPhases,
            total: totalPhases,
            percentage: Math.round((completedPhases / totalPhases) * 100)
        };
    },

    // Path management methods
    setSelectedPath(path) {
        localStorage.setItem(this.PATH_KEY, path);
    },

    getSelectedPath() {
        return localStorage.getItem(this.PATH_KEY);
    },

    isNovicePathComplete() {
        const novicePhases = this.paths.novice.totalPhases;
        let completedPhases = 0;
        
        for (const mission of this.paths.novice.missions) {
            completedPhases += this.progress[mission] ? this.progress[mission].length : 0;
        }
        
        return completedPhases >= novicePhases;
    },

    getPathProgress(pathName) {
        const path = this.paths[pathName];
        if (!path) return 0;
        
        let completedPhases = 0;
        for (const mission of path.missions) {
            completedPhases += this.progress[mission] ? this.progress[mission].length : 0;
        }
        
        return {
            completed: completedPhases,
            total: path.totalPhases,
            percentage: Math.round((completedPhases / path.totalPhases) * 100)
        };
    },
    
    // Setup scroll detection for chapter completion
    setupScrollDetection() {
        let scrollTimeout;
        let hasReachedEnd = false;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(() => {
                const scrollPosition = window.scrollY + window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                
                // Check if user scrolled to bottom (with 100px threshold)
                if (scrollPosition >= documentHeight - 100 && !hasReachedEnd) {
                    hasReachedEnd = true;
                    this.handleChapterEnd();
                }
            }, 200);
        });
    },
    
    // Handle when user reaches chapter end
    handleChapterEnd() {
        const body = document.body;
        const mission = body.getAttribute('data-mission');
        const phase = parseInt(body.getAttribute('data-phase'));
        
        if (mission && phase) {
            if (!this.isChapterComplete(mission, phase)) {
                this.completeChapter(mission, phase);
            }
        }
    },
    
    // Show completion animation
    showCompletionAnimation(mission, phase) {
        const overlay = document.createElement('div');
        overlay.className = 'completion-overlay';
        overlay.innerHTML = `
            <div class="completion-card">
                <div class="completion-icon"><i class="fas fa-bullseye"></i></div>
                <h2>Mission Phase Complete!</h2>
                <p>You've successfully completed this phase.</p>
                <div class="completion-stats">
                    <div class="stat">
                        <strong>${this.getMissionProgress(mission)}%</strong>
                        <span>Mission Progress</span>
                    </div>
                    <div class="stat">
                        <strong>${this.getOverallProgress().percentage}%</strong>
                        <span>Overall Progress</span>
                    </div>
                </div>
                <button onclick="ProgressTracker.closeCompletion()" class="next-mission-btn">Continue Mission</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add confetti effect
        this.createConfetti();
        
        // Auto-close after 5 seconds if user doesn't interact
        setTimeout(() => {
            if (document.querySelector('.completion-overlay')) {
                this.closeCompletion();
            }
        }, 8000);
    },
    
    // Close completion overlay
    closeCompletion() {
        const overlay = document.querySelector('.completion-overlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 300);
        }
    },
    
    // Create confetti animation
    createConfetti() {
        const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
    },
    
    // Update all UI elements
    updateAllUI() {
        this.updateChapterBadge();
        this.updateMissionControlProgress();
    },
    
    // Update chapter completion badge
    updateChapterBadge() {
        const body = document.body;
        const mission = body.getAttribute('data-mission');
        const phase = parseInt(body.getAttribute('data-phase'));
        
        if (mission && phase) {
            const isComplete = this.isChapterComplete(mission, phase);
            
            // Create or update completion badge
            let badge = document.querySelector('.chapter-completion-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'chapter-completion-badge';
                
                const header = document.querySelector('header');
                if (header) {
                    header.appendChild(badge);
                }
            }
            
            if (isComplete) {
                badge.innerHTML = '<span class="badge-icon">✓</span> Phase Completed';
                badge.classList.add('completed');
            } else {
                badge.innerHTML = '<span class="badge-icon">○</span> In Progress';
                badge.classList.remove('completed');
            }
        }
    },
    
    // Update mission control progress indicators
    updateMissionControlProgress() {
        // This runs on the homepage
        if (!document.querySelector('.mission-control')) return;
        
        // Update path interface if available
        if (typeof updatePathInterface === 'function') {
            updatePathInterface();
        }
        
        // Update section progress
        const sections = document.querySelectorAll('.mission-section');
        sections.forEach(section => {
            const mission = section.getAttribute('data-mission');
            if (mission && this.missions[mission]) {
                const progress = this.getMissionProgress(mission);
                const isComplete = this.isMissionComplete(mission);
                
                // Add progress bar
                let progressBar = section.querySelector('.section-progress-bar');
                if (!progressBar) {
                    progressBar = document.createElement('div');
                    progressBar.className = 'section-progress-bar';
                    const sectionHeader = section.querySelector('h3');
                    if (sectionHeader) {
                        sectionHeader.appendChild(progressBar);
                    }
                }
                
                progressBar.innerHTML = `
                    <div class="progress-container">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}% Complete</span>
                `;
                
                // Add completion badge
                if (isComplete) {
                    section.classList.add('mission-complete');
                    if (!section.querySelector('.complete-badge')) {
                        const badge = document.createElement('div');
                        badge.className = 'complete-badge';
                        badge.innerHTML = '✓ Mission Complete';
                        section.querySelector('h3').appendChild(badge);
                    }
                }
            }
        });
        
        // Update individual chapter links
        const chapterLinks = document.querySelectorAll('.mission-link');
        chapterLinks.forEach(link => {
            const mission = link.getAttribute('data-mission');
            const phase = parseInt(link.getAttribute('data-phase'));
            
            if (mission && phase) {
                const isComplete = this.isChapterComplete(mission, phase);
                
                if (isComplete) {
                    link.classList.add('chapter-complete');
                    if (!link.querySelector('.chapter-check')) {
                        const check = document.createElement('span');
                        check.className = 'chapter-check';
                        check.innerHTML = '✓';
                        link.insertBefore(check, link.firstChild);
                    }
                } else {
                    link.classList.remove('chapter-complete');
                    const check = link.querySelector('.chapter-check');
                    if (check) check.remove();
                }
            }
        });
        
        // Update overall progress
        this.updateOverallProgress();
    },
    
    // Update overall progress display
    updateOverallProgress() {
        const overall = this.getOverallProgress();
        
        let progressWidget = document.querySelector('.overall-progress-widget');
        if (!progressWidget) {
            progressWidget = document.createElement('div');
            progressWidget.className = 'overall-progress-widget';
            
            // Append directly to body instead of header
            document.body.appendChild(progressWidget);
        }
        
        progressWidget.innerHTML = `
            <h4><i class="fas fa-rocket"></i> Mission Progress</h4>
            <div class="circular-progress">
                <svg width="130" height="130">
                    <circle cx="65" cy="65" r="50" class="progress-bg"></circle>
                    <circle cx="65" cy="65" r="50" class="progress-bar" 
                            style="stroke-dashoffset: ${314 - (314 * overall.percentage / 100)}"></circle>
                </svg>
                <div class="progress-percentage">${overall.percentage}%</div>
            </div>
            <p class="progress-detail">${overall.completed} of ${overall.total} phases completed</p>
        `;
    },
    
    // Reset all progress (for testing)
    resetProgress() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.PATH_KEY);
            this.progress = {};
            this.updateAllUI();
            alert('Progress reset successfully!');
            location.reload();
        }
    },
    
    // Demo function to simulate novice path completion (for testing)
    simulateNoviceCompletion() {
        console.log('Simulating novice path completion...');
        
        // Complete mission briefing (1 phase)
        this.completeChapter('mission-briefing', 1);
        
        // Complete all git-basics phases (10 phases)
        for (let i = 1; i <= 10; i++) {
            this.completeChapter('git-basics', i);
        }
        
        // Complete all branches phases (8 phases)
        for (let i = 1; i <= 8; i++) {
            this.completeChapter('branches', i);
        }
        
        // Complete all advanced phases (7 phases)
        for (let i = 1; i <= 7; i++) {
            this.completeChapter('advanced', i);
        }
        
        // Complete all collaboration phases (6 phases)
        for (let i = 1; i <= 6; i++) {
            this.completeChapter('collaboration', i);
        }
        
        // Complete all beyond phases (3 phases)
        for (let i = 1; i <= 3; i++) {
            this.completeChapter('beyond', i);
        }
        
        console.log('Novice completion check:', this.isNovicePathComplete());
        this.updateAllUI();
        alert('Complete Cadet Training path finished! All 35 training phases completed.');
    }
};

// Path Selection Functions
function selectPath(pathName) {
    const currentPath = ProgressTracker.getSelectedPath();
    
    // If selecting the same path, just show mission control
    if (currentPath === pathName) {
        showMissionControl(pathName);
        return;
    }
    
    // If switching to a different path and user has progress, show confirmation
    if (currentPath && currentPath !== pathName && Object.keys(ProgressTracker.progress).length > 0) {
        showPathSwitchConfirmation(currentPath, pathName);
        return;
    }
    
    // If no current path or no progress, update selection directly
    ProgressTracker.setSelectedPath(pathName);
    showMissionControl(pathName);
}

function showPathSwitchConfirmation(fromPath, toPath) {
    const pathNames = {
        'novice': 'Cadet Training',
        'advanced': 'Commander Operations'
    };
    
    const confirmed = confirm(
        `Switch Learning Path?\n\n` +
        `You are switching from "${pathNames[fromPath]}" to "${pathNames[toPath]}".\n\n` +
        `✓ Your progress will be preserved\n` +
        `✓ You can switch back anytime\n` +
        `✓ All completed chapters remain completed\n\n` +
        `Continue with path switch?`
    );
    
    if (confirmed) {
        ProgressTracker.setSelectedPath(toPath);
        showMissionControl(toPath);
    }
}

function selectAdvancedPath() {
    // Advanced path is coming soon
    alert('Commander Operations Coming Soon!\n\nNew advanced missions are currently in development at Mission Control. Stay tuned for exciting new content that will take your Git skills to the next level!');
}

function showAdvancedConfirmationModal() {
    document.getElementById('advanced-confirmation-modal').style.display = 'flex';
}

function closeAdvancedModal() {
    document.getElementById('advanced-confirmation-modal').style.display = 'none';
}

function confirmAdvancedPath() {
    closeAdvancedModal();
    selectPath('advanced');
}

function showMissionControl(pathName) {
    console.log('Showing mission control for path:', pathName);
    
    // Hide path selection with fade effect
    const pathContainer = document.querySelector('.path-selection-container');
    pathContainer.style.opacity = '0';
    pathContainer.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        pathContainer.style.display = 'none';
        
        // Show mission control
        const missionControl = document.getElementById('mission-control');
        missionControl.style.display = 'block';
        missionControl.style.opacity = '0';
        
        // Filter missions based on selected path
        filterMissionsForPath(pathName);
        
        // Update progress tracking
        ProgressTracker.updateAllUI();
        
        // Show path navigation
        const pathNavigation = document.getElementById('path-navigation');
        if (pathNavigation) {
            pathNavigation.style.display = 'block';
        }
        
        // Fade in mission control
        setTimeout(() => {
            missionControl.style.opacity = '1';
            missionControl.style.transform = 'translateY(0)';
        }, 100);
    }, 300);
}

function filterMissionsForPath(pathName) {
    const allSections = document.querySelectorAll('.mission-section');
    
    allSections.forEach(section => {
        const mission = section.getAttribute('data-mission');
        const missionData = ProgressTracker.missions[mission];
        
        if (missionData && missionData.path === pathName) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

function showPathSelection() {
    console.log('Returning to path selection...');
    
    // Hide mission control with fade effect
    const missionControl = document.getElementById('mission-control');
    missionControl.style.opacity = '0';
    missionControl.style.transform = 'translateY(-20px)';
    
    // Also hide path navigation
    const pathNavigation = document.getElementById('path-navigation');
    if (pathNavigation) {
        pathNavigation.style.display = 'none';
    }
    
    setTimeout(() => {
        missionControl.style.display = 'none';
        
        // Show path selection
        const pathContainer = document.querySelector('.path-selection-container');
        pathContainer.style.display = 'block';
        pathContainer.style.opacity = '0';
        
        // Update path interface (but don't clear the selected path from storage yet)
        updatePathInterface();
        
        // Fade in path selection
        setTimeout(() => {
            pathContainer.style.opacity = '1';
            pathContainer.style.transform = 'translateY(0)';
        }, 100);
    }, 300);
    
    // Note: We don't clear the selected path here anymore
    // This allows users to see their current selection and change it if needed
}

function updatePathInterface() {
    const noviceComplete = ProgressTracker.isNovicePathComplete();
    const advancedLock = document.getElementById('advanced-lock');
    const advancedButton = document.getElementById('advanced-button');
    const noviceCompletion = document.getElementById('novice-completion');
    const currentPath = ProgressTracker.getSelectedPath();
    
    // Update completion status
    if (noviceComplete) {
        noviceCompletion.style.display = 'flex';
    } else {
        noviceCompletion.style.display = 'none';
    }
    
    // Update path buttons based on current selection
    const noviceButton = document.querySelector('.novice-path .path-button');
    const noviceCard = document.getElementById('novice-path');
    const advancedCard = document.getElementById('advanced-path');
    
    // Reset button states
    noviceButton.textContent = 'Begin Cadet Training';
    noviceCard.classList.remove('path-selected');
    advancedCard.classList.remove('path-selected');
    
    // Show current selection if any
    if (currentPath === 'novice') {
        noviceButton.textContent = 'Continue Cadet Training';
        noviceCard.classList.add('path-selected');
        
        // Add switch path option
        const switchText = document.createElement('div');
        switchText.className = 'current-path-indicator';
        switchText.innerHTML = '<i class="fas fa-check-circle"></i> Currently Selected Path';
        
        // Remove existing indicator if any
        const existingIndicator = noviceCard.querySelector('.current-path-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Add indicator before button
        const pathButton = noviceCard.querySelector('.path-button');
        pathButton.parentNode.insertBefore(switchText, pathButton);
        
    } else if (currentPath === 'advanced') {
        advancedCard.classList.add('path-selected');
    }
    
    // Advanced path is always locked - coming soon
    advancedLock.style.display = 'flex';
    advancedButton.disabled = true;
    advancedButton.textContent = 'Coming Soon - New Missions in Development';
}

// Check if returning user has selected path
function checkExistingPath() {
    console.log('Checking existing path...');
    const selectedPath = ProgressTracker.getSelectedPath();
    console.log('Selected path:', selectedPath);
    
    if (selectedPath) {
        showMissionControl(selectedPath);
    } else {
        // Only update path interface if we're on the homepage
        setTimeout(() => {
            if (document.querySelector('.path-selection-container')) {
                updatePathInterface();
            }
        }, 100);
    }
}

// System Test Function
function runSystemTest() {
    console.log('Starting LearnGit.space Path System Test...');
    
    const results = [];
    
    // Test 1: Path interface elements exist
    const pathContainer = document.querySelector('.path-selection-container');
    const novicePath = document.getElementById('novice-path');
    const advancedPath = document.getElementById('advanced-path');
    const modal = document.getElementById('advanced-confirmation-modal');
    
    results.push(`✓ Path selection interface: ${pathContainer ? 'FOUND' : 'MISSING'}`);
    results.push(`✓ Novice path card: ${novicePath ? 'FOUND' : 'MISSING'}`);
    results.push(`✓ Advanced path card: ${advancedPath ? 'FOUND' : 'MISSING'}`);
    results.push(`✓ Confirmation modal: ${modal ? 'FOUND' : 'MISSING'}`);
    
    // Test 2: Progress tracking functionality
    const initialNoviceComplete = ProgressTracker.isNovicePathComplete();
    results.push(`✓ Initial novice completion: ${initialNoviceComplete}`);
    
    // Test 3: Path definitions
    const novicePathData = ProgressTracker.paths.novice;
    const advancedPathData = ProgressTracker.paths.advanced;
    results.push(`✓ Novice path missions: ${novicePathData.missions.length} (expected: 3)`);
    results.push(`✓ Advanced path missions: ${advancedPathData.missions.length} (expected: 3)`);
    results.push(`✓ Novice total phases: ${novicePathData.totalPhases} (expected: 19)`);
    results.push(`✓ Advanced total phases: ${advancedPathData.totalPhases} (expected: 16)`);
    
    // Test 4: Function availability
    const functions = [
        'selectPath', 'selectAdvancedPath', 'showAdvancedConfirmationModal', 
        'closeAdvancedModal', 'confirmAdvancedPath', 'showMissionControl', 
        'showPathSelection', 'updatePathInterface', 'showPathSwitchConfirmation'
    ];
    
    functions.forEach(func => {
        results.push(`✓ Function ${func}: ${typeof window[func] === 'function' ? 'AVAILABLE' : 'MISSING'}`);
    });
    
    // Test 5: Mission sections have correct data attributes
    const missionSections = document.querySelectorAll('.mission-section');
    const sectionCount = missionSections.length;
    results.push(`✓ Mission sections found: ${sectionCount} (expected: 6)`);
    
    let sectionsWithPath = 0;
    missionSections.forEach(section => {
        const mission = section.getAttribute('data-mission');
        if (ProgressTracker.missions[mission]) {
            sectionsWithPath++;
        }
    });
    results.push(`✓ Sections with valid mission data: ${sectionsWithPath}/${sectionCount}`);
    
    // Display results
    const testResults = `
LEARNGIT.SPACE SYSTEM TEST RESULTS

${results.join('\n')}

SUMMARY:
- Total tests: ${results.length}
- Path system: ${pathContainer && novicePath && advancedPath ? 'OPERATIONAL' : 'ISSUES DETECTED'}
- Progress tracking: ${typeof ProgressTracker.isNovicePathComplete === 'function' ? 'FUNCTIONAL' : 'ERROR'}
- Modal system: ${modal ? 'READY' : 'MISSING'}

System Status: ${results.every(r => !r.includes('MISSING') && !r.includes('ERROR')) ? 'ALL SYSTEMS GO!' : 'SOME ISSUES DETECTED'}
    `;
    
    console.log(testResults);
    alert(testResults);
}

// Theme Manager for Princess Pink Theme
const ThemeManager = {
    STORAGE_KEY: 'learngit_theme',
    
    // Initialize theme manager
    init() {
        this.loadTheme();
        this.updateThemeButton();
    },
    
    // Get current theme
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'default';
    },
    
    // Set theme
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.updateThemeButton();
        
        // Add subtle transition effect when switching themes
        document.body.style.transition = 'background 0.5s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 500);
    },
    
    // Toggle between themes
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'princess-pink' ? 'default' : 'princess-pink';
        this.setTheme(newTheme);
        
        // Show feedback to user with bottom snackbar
        this.showThemeChangeNotification(newTheme);
    },
    
    // Load saved theme from localStorage
    loadTheme() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        if (savedTheme && savedTheme !== 'default') {
            this.setTheme(savedTheme);
        }
    },
    
    // Update theme button appearance
    updateThemeButton() {
        const button = document.querySelector('.theme-toggle');
        if (!button) return;
        
        const icon = button.querySelector('.theme-icon');
        const label = button.querySelector('.theme-label');
        const currentTheme = this.getCurrentTheme();
        
        if (currentTheme === 'princess-pink') {
            icon.innerHTML = '<i class="fas fa-rocket"></i>';
            label.textContent = 'Default';
            button.setAttribute('aria-label', 'Switch to Default theme');
        } else {
            icon.innerHTML = '<i class="fas fa-crown"></i>';
            label.textContent = 'Princess Pink';
            button.setAttribute('aria-label', 'Switch to Princess Pink theme');
        }
    },
    
    // Show theme change notification as bottom snackbar
    showThemeChangeNotification(newTheme) {
        const notification = document.createElement('div');
        notification.className = 'theme-snackbar';
        notification.innerHTML = `
            <div class="snackbar-content">
                <span class="snackbar-icon">${newTheme === 'princess-pink' ? '<i class="fas fa-crown"></i>' : '<i class="fas fa-rocket"></i>'}</span>
                <span class="snackbar-text">
                    Switched to ${newTheme === 'princess-pink' ? 'Princess Pink' : 'Default'} theme
                </span>
            </div>
        `;
        
        // Add snackbar styles
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            z-index: 1001;
            background: linear-gradient(135deg, rgba(26, 31, 58, 0.95) 0%, rgba(42, 47, 74, 0.95) 100%);
            color: var(--text-light);
            padding: 1rem 1.5rem;
            border-radius: 25px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 500;
            min-width: 200px;
            text-align: center;
            transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        
        // Add icon styling
        const icon = notification.querySelector('.snackbar-icon');
        if (icon) {
            icon.style.cssText = `
                color: var(--primary-gold);
                margin-right: 0.5rem;
                filter: drop-shadow(0 0 5px var(--glow-gold));
            `;
        }
        
        document.body.appendChild(notification);
        
        // Animate in (slide up from bottom)
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // Remove after 2.5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2500);
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ProgressTracker.init();
        checkExistingPath();
        ThemeManager.init();
    });
} else {
    ProgressTracker.init();
    checkExistingPath();
    ThemeManager.init();
}
