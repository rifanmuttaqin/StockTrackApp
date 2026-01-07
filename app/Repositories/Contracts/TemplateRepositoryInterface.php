<?php

namespace App\Repositories\Contracts;

use App\Models\Template;

interface TemplateRepositoryInterface
{
    /**
     * Get all templates
     */
    public function getAll(): array;

    /**
     * Get template by id
     */
    public function getById(string $id): ?Template;

    /**
     * Create new template
     */
    public function create(array $data): Template;

    /**
     * Update template
     */
    public function update(string $id, array $data): bool;

    /**
     * Soft delete template
     */
    public function delete(string $id): bool;

    /**
     * Force delete template (permanen)
     */
    public function forceDelete(string $id): bool;

    /**
     * Restore deleted template
     */
    public function restore(string $id): bool;

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
    public function getWithVariants(string $id): ?Template;

    /**
     * Search templates by name
     */
    public function search(string $keyword): array;
}
