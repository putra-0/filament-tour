<?php

namespace YacoubAlhaidari\FilamentTour\Services;

use Filament\Facades\Filament;
use YacoubAlhaidari\FilamentTour\Concerns\HasTourSteps;

class TourStepCollector
{
    /**
     * Collect tour steps from all registered resources
     */
    public static function collectSteps(string $globalDisplayMode = 'always'): array
    {
        $steps = [];
        $panel = Filament::getCurrentPanel();

        if (!$panel) {
            return $steps;
        }

        foreach ($panel->getResources() as $resource) {
            // Check if resource uses HasTourSteps trait
            if (!in_array(HasTourSteps::class, class_uses_recursive($resource))) {
                continue;
            }

            if (!$resource::hasTourStep()) {
                continue;
            }

            $stepId = $resource::getTourStepId();
            $title = $resource::getTourStepTitle();
            $description = $resource::getTourStepDescription();
            $features = $resource::getTourStepFeatures();
            $position = $resource::getTourStepPosition();
            $sort = $resource::getTourStepSort();

            $resourceDisplayMode = $resource::getTourDisplayMode();
            $effectiveDisplayMode = $resourceDisplayMode ?? $globalDisplayMode;

            // Get resource URL
            $url = null;
            try {
                $url = $resource::getUrl('index');
            } catch (\Exception $e) {
                // Resource might not have index page
            }

            // Build step text
            $text = static::buildStepText($description, $features);

            $steps[] = [
                'id' => $stepId,
                'title' => $title,
                'text' => $text,
                'attachTo' => '[data-tour="' . $stepId . '"]',
                'position' => $position,
                'sort' => $sort,
                'url' => $url,
                'display_mode' => $effectiveDisplayMode,
                'buttons' => [
                    ['text' => __('filament-tour::filament-tour.buttons.previous'), 'action' => 'back', 'secondary' => true],
                    ['text' => __('filament-tour::filament-tour.buttons.next'), 'action' => 'next', 'secondary' => false],
                ],
            ];

            $customSteps = $resource::getTourSteps();
            foreach ($customSteps as $customStep) {
                $customDisplayMode = $customStep['display_mode'] ?? $effectiveDisplayMode;
                $steps[] = array_merge([
                    "display_mode" => $customDisplayMode,
                    "buttons" => [
                        ["text" => __("filament-tour::filament-tour.buttons.previous"), "action" => "back", "secondary" => true],
                        ["text" => __("filament-tour::filament-tour.buttons.next"), "action" => "next", "secondary" => false],
                    ],
                ], $customStep);
            }
        }

        // Sort steps by sort order (ascending)
        usort($steps, function ($a, $b) {
            return $a['sort'] <=> $b['sort'];
        });

        return $steps;
    }

    /**
     * Build step text from description and features
     */
    protected static function buildStepText(?string $description, array $features): string
    {
        $text = '<br>';

        if ($description) {
            $text .= $description . '<br><br>';
        }

        if (!empty($features)) {
            $text .= __('filament-tour::filament-tour.you_can') . '<br>';
            foreach ($features as $feature) {
                $text .= '• ' . $feature . '<br>';
            }
        }

        return $text;
    }

    /**
     * Get navigation map for data-tour attributes
     */
    public static function getNavigationMap(): array
    {
        $map = [];
        $panel = Filament::getCurrentPanel();

        if (!$panel) {
            return $map;
        }

        foreach ($panel->getResources() as $resource) {
            if (!in_array(HasTourSteps::class, class_uses_recursive($resource))) {
                continue;
            }

            if (!$resource::hasTourStep()) {
                continue;
            }

            $stepId = $resource::getTourStepId();
            $label = $resource::getNavigationLabel();

            $map[$label] = $stepId;
        }

        return $map;
    }
}
