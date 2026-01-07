<?php

namespace App\Services\Contracts;

use App\Models\Template;

interface TemplateServiceInterface
{
    /**
     * Get all templates
     */
    public function getAllTemplates(): array;

    /**
     * Get template by id
     */
    public function getTemplateById(string $id): ?Template;

    /**
     * Create new template dengan items
     */
    public function createTemplate(array $data): Template;

    /**
     * Update template dan items
     */
    public function updateTemplate(string $id, array $data): bool;

    /**
     * Soft delete template
     */
    public function deleteTemplate(string $id): bool;

    /**
     * Force delete template
     */
    public function forceDeleteTemplate(string $id): bool;

    /**
     * Restore deleted template
     */
    public function restoreTemplate(string $id): bool;

    /**
     * Get active template
     */
    public function getActiveTemplate(): ?Template;

    /**
     * Set template as active
     */
    public function setActiveTemplate(string $id): bool;

    /**
     * Get template with variants
     */
    public function getTemplateWithVariants(string $id): ?Template;

    /**
     * Search templates
     */
    public function searchTemplates(string $keyword): array;
}
