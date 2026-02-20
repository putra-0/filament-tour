{{-- Load Shepherd.js CSS from CDN --}}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/shepherd.js@11.2.0/dist/css/shepherd.css">
<script src="https://cdn.jsdelivr.net/npm/shepherd.js@11.2.0/dist/js/shepherd.min.js"></script>
{{-- Apply Custom Colors via CSS Variables --}}
@if (
    $headerColor ||
        $primaryButtonColor ||
        $secondaryButtonColor ||
        $textColor ||
        $backgroundColor ||
        $contentBackgroundColor ||
        $primaryButtonHoverColor ||
        $secondaryButtonHoverColor ||
        $footerBackgroundColor ||
        $primaryButtonTextColor ||
        $secondaryButtonTextColor ||
        $footerBorderColor)
    <style>
        :root {
            @if ($headerColor)
                --tour-header-color: {{ $headerColor }};
            @endif

            @if ($primaryButtonColor)
                --tour-primary-btn-color: {{ $primaryButtonColor }};
            @endif

            @if ($secondaryButtonColor)
                --tour-secondary-btn-color: {{ $secondaryButtonColor }};
            @endif

            @if ($textColor)
                --tour-text-color: {{ $textColor }};
            @endif

            @if ($backgroundColor)
                --tour-background-color: {{ $backgroundColor }};
            @endif

            @if ($contentBackgroundColor)
                --tour-content-bg-color: {{ $contentBackgroundColor }};
            @endif

            @if ($primaryButtonHoverColor)
                --tour-primary-btn-hover: {{ $primaryButtonHoverColor }};
            @endif

            @if ($secondaryButtonHoverColor)
                --tour-secondary-btn-hover: {{ $secondaryButtonHoverColor }};
            @endif

            @if ($footerBackgroundColor)
                --tour-footer-bg-color: {{ $footerBackgroundColor }};
            @endif

            @if ($primaryButtonTextColor)
                --tour-primary-btn-text: {{ $primaryButtonTextColor }};
            @endif

            @if ($secondaryButtonTextColor)
                --tour-secondary-btn-text: {{ $secondaryButtonTextColor }};
            @endif

            @if ($footerBorderColor)
                --tour-footer-border: {{ $footerBorderColor }};
            @endif
        }
    </style>
@endif

{{-- Pass dynamic tour steps to JavaScript --}}
<script>
    window.dynamicTourSteps = @json($tourSteps ?? []);
    window.navigationMap = @json($navigationMap ?? []);
    window.customWelcomeStep = @json($welcomeStep ?? null);
    window.customFinishStep = @json($finishStep ?? null);
    window.tourTranslations = @json($translations ?? []);
</script>

<script>
    // Add data-tour attributes to navigation items after DOM loads
    document.addEventListener('DOMContentLoaded', function() {
        // Function to add data-tour attribute to navigation items
        function addTourAttributes() {
            // Find navigation items by their text content
            const navItems = document.querySelectorAll(
                '.fi-sidebar-item, .fi-sidebar-group, [role="menuitem"]');

            navItems.forEach(item => {
                const text = item.textContent.trim();
                const link = item.querySelector('a');
                const target = link || item;

                // Use dynamic navigation map from resources
                const navigationMap = window.navigationMap || {};

                // Check dynamic mappings first
                let matched = false;
                Object.entries(navigationMap).forEach(([tourId, navText]) => {
                    if (text.includes(navText) || text === navText) {
                        target.setAttribute('data-tour', tourId);
                        matched = true;
                    }
                });

                // If not matched, try static fallback mappings
                if (!matched) {
                    // Custom fallback logic can be added here
                }
            });

        }

        // Initial run
        setTimeout(addTourAttributes, 500);

        // Re-run when Livewire updates the DOM (for SPAs)
        document.addEventListener('livewire:navigated', () => {
            setTimeout(addTourAttributes, 300);
        });

        // Fallback: Watch for DOM mutations
        const observer = new MutationObserver(function(mutations) {
            // Debounce the function call
            clearTimeout(window.tourAttributeTimeout);
            window.tourAttributeTimeout = setTimeout(addTourAttributes, 200);
        });

        const sidebar = document.querySelector('.fi-sidebar') || document.querySelector('.fi-sidebar-item') ||
            document.querySelector('.fi-sidebar-sub-group-items');
        if (sidebar) {
            observer.observe(sidebar, {
                childList: true,
                subtree: true
            });
        }
    });
</script>
