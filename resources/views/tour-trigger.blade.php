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
    window.tourDisplayMode = @json($displayMode ?? 'always');
</script>

@if(request()->routeIs('filament.admin.auth.login'))
<script>
    localStorage.removeItem('shepherd-tour-completed');
    localStorage.removeItem('shepherd-tour-completed-at');
    localStorage.removeItem('shepherd-tour-completed-permanent');
    localStorage.removeItem('shepherd-tour-seen-steps');
    localStorage.removeItem('shepherd-tour-in-progress');
    localStorage.removeItem('shepherd-tour-current-step');
</script>
@endif

<script>
    // Inject data-tour attributes on sidebar items by URL matching
    (function () {
        function applyTourAttrs() {
            var steps = window.dynamicTourSteps || [];
            if (!steps.length) return;

            steps.forEach(function(step) {
                if (!step.url || !step.attachTo || step.attachTo.indexOf('[data-tour') === -1) return;
                var path = new URL(step.url, window.location.origin).pathname.replace(/\/$/, '');

                document.querySelectorAll('.fi-sidebar-item a[href]').forEach(function(a) {
                    var href = (a.getAttribute('href') || '').replace(window.location.origin, '').replace(/\/$/, '');
                    if (href === path || href.startsWith(path + '?')) {
                        var item = a.closest('.fi-sidebar-item');
                        if (item && !item.hasAttribute('data-tour')) {
                            item.setAttribute('data-tour', step.id);
                        }
                    }
                });
            });
        }
        window._applyTourAttrs = applyTourAttrs;

        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(applyTourAttrs, 400);
            setTimeout(applyTourAttrs, 1000);
        });

        document.addEventListener('livewire:navigated', function() {
            requestAnimationFrame(applyTourAttrs);
            setTimeout(applyTourAttrs, 200);
            setTimeout(applyTourAttrs, 600);
            setTimeout(applyTourAttrs, 1200);
        });
    })();
</script>
