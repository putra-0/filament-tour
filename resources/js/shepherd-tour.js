// Shepherd is loaded globally from the CDN script in the Blade view
const Shepherd = window.Shepherd;

// Static Tour Steps - Only Welcome and Finish
// Static Tour Steps - Fallback only
const tourStepsData = [];

// Initialize tour
export function initializeShepherdTour(resumeFromStep = null) {
    // Create a new tour instance
    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shepherd-theme-custom',
            scrollTo: { behavior: 'smooth', block: 'center' },
            cancelIcon: {
                enabled: true,
                label: window.tourTranslations?.buttons?.cancel || 'Close'
            },
            modalOverlayOpeningRadius: 12,
            modalOverlayOpeningPadding: 10
        },
        tourName: 'app-tour'
    });

    // Store original active navigation items
    let originalActiveItems = [];

    // Remove Filament's default active highlighting when tour starts
    tour.on('start', () => {
        // Find all currently active navigation items
        originalActiveItems = Array.from(document.querySelectorAll('.fi-sidebar-item.fi-active, .fi-sidebar-group-item.fi-active, [data-tour].fi-active'));
        
        console.log('Tour started, hiding original active items:', originalActiveItems.length);
        
        // Hide their active state temporarily
        originalActiveItems.forEach(item => {
            item.classList.add('tour-original-active');
            item.classList.remove('fi-active');
        });
    });

    // Highlight only the current tour step's navigation item
    tour.on('show', (event) => {
        if (event.step) {
            const stepId = event.step.id;
            console.log(`\n🎯 Tour Step Changed: "${stepId}"`);
            console.log(`   Step Title: "${event.step.options.title}"`);
            
            localStorage.setItem('shepherd-tour-current-step', stepId);
            localStorage.setItem('shepherd-tour-in-progress', 'true');

            const currentStepData = allSteps.find(s => s.id === stepId);
            if (currentStepData && currentStepData.display_mode === 'once') {
                const seenSteps = JSON.parse(localStorage.getItem('shepherd-tour-seen-steps') || '[]');
                if (!seenSteps.includes(stepId)) {
                    seenSteps.push(stepId);
                    localStorage.setItem('shepherd-tour-seen-steps', JSON.stringify(seenSteps));
                    console.log(`👁️ Marked "once" step as seen: ${stepId}`);
                }
            }
            
            // Remove previous tour highlighting
            const previousHighlighted = document.querySelectorAll('.shepherd-tour-active-nav');
            console.log(`   Removing ${previousHighlighted.length} previous highlights`);
            previousHighlighted.forEach(item => {
                item.classList.remove('shepherd-tour-active-nav');
            });
            
            // Add highlighting to current step's navigation item
            setTimeout(() => {
                // Show all available data-tour attributes
                const allTourElements = document.querySelectorAll('[data-tour]');
                console.log(`   Available [data-tour] elements:`, Array.from(allTourElements).map(el => el.getAttribute('data-tour')));
                
                const navItem = document.querySelector(`[data-tour="${stepId}"]`);
                console.log(`   Looking for: [data-tour="${stepId}"]`);
                console.log(`   Found element:`, navItem);
                
                if (navItem) {
                    const navContainer = 
                        navItem.closest('.fi-sidebar-item') || 
                        navItem.closest('.fi-sidebar-group-item') || 
                        navItem.closest('.fi-sidebar-item-button') ||
                        navItem.closest('li') ||
                        navItem.parentElement ||
                        navItem;
                    
                    console.log(`   Nav container:`, navContainer);
                    
                    if (navContainer) {
                        navContainer.classList.add('shepherd-tour-active-nav');
                        if (navItem !== navContainer) {
                            navItem.classList.add('shepherd-tour-active-nav');
                        }
                        navContainer.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest',
                            inline: 'nearest'
                        });
                        console.log(`   ✅ Successfully highlighted: "${stepId}"`);
                    } else {
                        console.warn(`   ❌ Could not find nav container for: "${stepId}"`);
                    }
                } else {
                    console.warn(`   ❌ No nav item found with [data-tour="${stepId}"]`);
                }
            }, 300);
        }
    });

    // Restore original active highlighting when tour completes
    tour.on('complete', () => {
        localStorage.removeItem('shepherd-tour-current-step');
        localStorage.removeItem('shepherd-tour-in-progress');
        localStorage.setItem('shepherd-tour-completed', 'true');
        localStorage.setItem('shepherd-tour-completed-at', new Date().toISOString());

        if ((window.tourDisplayMode || 'always') === 'once') {
            localStorage.setItem('shepherd-tour-completed-permanent', 'true');
            console.log('🔒 Tour permanently completed (display mode: once)');
        }
        
        // Remove tour highlighting
        document.querySelectorAll('.shepherd-tour-active-nav').forEach(item => {
            item.classList.remove('shepherd-tour-active-nav');
        });
        
        // Restore original active items
        originalActiveItems.forEach(item => {
            item.classList.remove('tour-original-active');
            item.classList.add('fi-active');
        });
        
        console.log('Tour completed, restored original active items');
    });

    // Restore original active highlighting when tour is cancelled
    tour.on('cancel', () => {
        localStorage.removeItem('shepherd-tour-current-step');
        localStorage.removeItem('shepherd-tour-in-progress');
        
        // Remove tour highlighting
        document.querySelectorAll('.shepherd-tour-active-nav').forEach(item => {
            item.classList.remove('shepherd-tour-active-nav');
        });
        
        // Restore original active items
        originalActiveItems.forEach(item => {
            item.classList.remove('tour-original-active');
            item.classList.add('fi-active');
        });
        
        console.log('Tour cancelled, restored original active items');
    });

    // Merge static steps with dynamic steps from resources
    const dynamicSteps = window.dynamicTourSteps || [];
    
    // Use custom welcome/finish steps if provided, otherwise use defaults
    // Use custom welcome/finish steps passed from PHP
    const welcomeStep = window.customWelcomeStep;
    const finishStep = window.customFinishStep;
    
    // Build complete steps array: Welcome → Dynamic Steps → Finish
    const seenSteps = JSON.parse(localStorage.getItem('shepherd-tour-seen-steps') || '[]');
    const allSteps = [];
    if (welcomeStep) allSteps.push(welcomeStep);
    dynamicSteps.forEach(step => {
        if (step.display_mode === 'once' && seenSteps.includes(step.id)) {
            console.log(`⏭️ Skipping seen "once" step: ${step.id}`);
            return;
        }
        allSteps.push(step);
    });
    if (finishStep) allSteps.push(finishStep);

    // Add steps from combined data
    allSteps.forEach((stepData, index) => {
        const stepConfig = {
            id: stepData.id,
            title: stepData.title,
            text: stepData.text,
        };

        // Add beforeShowPromise to navigate to resource page if needed
        if (stepData.url) {
            stepConfig.beforeShowPromise = function() {
                return new Promise((resolve) => {
                    const currentUrl = window.location.pathname;
                    const targetUrl = new URL(stepData.url, window.location.origin).pathname;

                    console.log(`\n🚀 Navigation Check for step: ${stepData.id}`);
                    console.log(`   Current URL: ${currentUrl}`);
                    console.log(`   Target URL: ${targetUrl}`);

                    // Check if we're already on the target page
                    if (currentUrl !== targetUrl) {
                        console.log(`   ⚡ Navigating to: ${stepData.url}`);

                        // Use Livewire navigate if available (SPA mode)
                        if (typeof Livewire !== 'undefined' && Livewire.navigate) {
                            Livewire.navigate(stepData.url);

                            // Wait for Livewire navigation to complete
                            document.addEventListener('livewire:navigated', function handler() {
                                document.removeEventListener('livewire:navigated', handler);
                                tour.modal = null;
                                if (window._applyTourAttrs) window._applyTourAttrs();
                                var attempts = 0, max = 25;
                                var poll = setInterval(function() {
                                    attempts++;
                                    if (window._applyTourAttrs) window._applyTourAttrs();
                                    var el = document.querySelector(stepData.attachTo);
                                    if (el || attempts >= max) {
                                        clearInterval(poll);
                                        resolve();
                                    }
                                }, 200);
                            }, { once: true });
                        } else {
                            // Fallback to regular navigation
                            window.location.href = stepData.url;
                        }
                    } else {
                        if (window._applyTourAttrs) window._applyTourAttrs();
                        var poll = setInterval(function() {
                            var el = document.querySelector(stepData.attachTo);
                            if (el) { clearInterval(poll); resolve(); }
                        }, 200);
                        setTimeout(function() { clearInterval(poll); resolve(); }, 5000);
                    }
                });
            };
        }

        // Attach to elements — pass selector string so Shepherd resolves it at display time
        if (stepData.attachTo) {
            stepConfig.attachTo = {
                element: stepData.attachTo,
                on: stepData.position || 'right'
            };
        }

        // Build buttons
        const buttons = [];
        const stepButtons = stepData.buttons || [
            { text: window.tourTranslations?.buttons?.previous || 'Previous', action: 'back', secondary: true },
            { text: window.tourTranslations?.buttons?.next || 'Next', action: 'next', secondary: false }
        ];

        stepButtons.forEach(btnData => {
            const button = {
                text: btnData.text,
                secondary: btnData.secondary || false
            };

            // Handle button actions
            if (btnData.action === 'back') {
                button.action = tour.back;
            } else if (btnData.action === 'next') {
                button.action = tour.next;
            } else if (btnData.action === 'cancel') {
                button.action = tour.cancel;
            } else if (btnData.action === 'complete') {
                button.action = tour.complete;
            }

            buttons.push(button);
        });

        stepConfig.buttons = buttons;

        // Add the step to the tour
        tour.addStep(stepConfig);
    });

    return tour;
}

// Auto-detect navigation elements and add data-tour attributes
function autoDetectNavigationElements() {
    // Use the URL-based matching from the inline script (more reliable)
    if (window._applyTourAttrs) {
        window._applyTourAttrs();
    }

    // Also match by navigation label as fallback
    const navigationMap = window.navigationMap || {};
    if (!Object.keys(navigationMap).length) return;

    const navItems = document.querySelectorAll('.fi-sidebar-item, .fi-sidebar-group, [role="menuitem"], a[href*="/admin"]');

    navItems.forEach(item => {
        const text = item.textContent.trim();
        const link = item.querySelector('a') || item;

        Object.entries(navigationMap).forEach(([navLabel, stepId]) => {
            if (text.includes(navLabel) || text === navLabel) {
                if (!link.hasAttribute('data-tour')) {
                    link.setAttribute('data-tour', stepId);
                }
            }
        });
    });
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Auto-detect navigation elements
    autoDetectNavigationElements();
    
    // Re-run detection when navigation updates
    setTimeout(autoDetectNavigationElements, 1000);
    
    // Watch for navigation changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                setTimeout(autoDetectNavigationElements, 100);
            }
        });
    });
    
    const sidebar = document.querySelector('.fi-sidebar');
    if (sidebar) {
        observer.observe(sidebar, {
            childList: true,
            subtree: true
        });
    }

    // Check if user wants to see the tour
    const tourButtons = document.querySelectorAll('[data-shepherd-tour-trigger]');
    tourButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            try {
                const permanentCompleted = localStorage.getItem('shepherd-tour-completed-permanent');
                if (permanentCompleted === 'true') {
                    console.log('🔒 Tour permanently completed, resetting for fresh start');
                    localStorage.removeItem('shepherd-tour-completed-permanent');
                    localStorage.removeItem('shepherd-tour-seen-steps');
                }

                const tour = initializeShepherdTour();
                
                // Check if there's a tour in progress
                const inProgress = localStorage.getItem('shepherd-tour-in-progress');
                const currentStepId = localStorage.getItem('shepherd-tour-current-step');
                
                if (inProgress === 'true' && currentStepId) {
                    // Resume from the last step
                    console.log(`Resuming tour from step: ${currentStepId}`);
                    tour.show(currentStepId);
                } else {
                    // Start from beginning
                    tour.start();
                }
            } catch (error) {
                console.error('Error starting tour:', error);
                alert('An error occurred while starting the tour. Please try again.');
            }
        });
    });

    // Auto-resume tour if in progress (after page navigation)
    const permanentCompleted = localStorage.getItem('shepherd-tour-completed-permanent');

    if (permanentCompleted === 'true') {
        console.log('🔒 Tour permanently completed, skipping');
        return;
    }

    const inProgress = localStorage.getItem('shepherd-tour-in-progress');
    const currentStepId = localStorage.getItem('shepherd-tour-current-step');

    if (inProgress === 'true' && currentStepId) {
        setTimeout(() => {
            try {
                const tour = initializeShepherdTour();
                if (tour.steps.length <= 2) {
                    console.log('⚠️ No un-seen dynamic steps remaining, cancelling tour');
                    localStorage.removeItem('shepherd-tour-in-progress');
                    localStorage.removeItem('shepherd-tour-current-step');
                    return;
                }
                console.log(`Auto-resuming tour at step: ${currentStepId}`);
                tour.show(currentStepId);
            } catch (error) {
                console.error('Error auto-resuming tour:', error);
                // Clear invalid tour state
                localStorage.removeItem('shepherd-tour-in-progress');
                localStorage.removeItem('shepherd-tour-current-step');
            }
        }, 1500); // Wait for page to fully load
    } else {
        const tourCompleted = localStorage.getItem('shepherd-tour-completed');

        if (!tourCompleted) {
            setTimeout(() => {
                try {
                    const tour = initializeShepherdTour();
                    if (tour.steps.length <= 2) {
                        console.log('⚠️ No dynamic steps available, skipping auto-start');
                        return;
                    }
                    console.log('🚀 Auto-starting tour');
                    tour.start();
                } catch (error) {
                    console.error('Error auto-starting tour:', error);
                }
            }, 2000);
        }
    }
});


// Export for use in other modules
export default initializeShepherdTour;

