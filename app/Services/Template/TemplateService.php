<?php

namespace App\Services\Template;

use App\Models\Template;
use App\Repositories\Contracts\TemplateRepositoryInterface;
use App\Services\Contracts\TemplateServiceInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class TemplateService implements TemplateServiceInterface
{
    protected TemplateRepositoryInterface $templateRepository;

    public function __construct(TemplateRepositoryInterface $templateRepository)
    {
        $this->templateRepository = $templateRepository;
    }

    /**
     * Get all templates
     */
    public function getAllTemplates(): array
    {
        Log::info('TemplateService::getAllTemplates - Fetching all templates');

        return $this->templateRepository->getAll();
    }

    /**
     * Get template by id
     */
    public function getTemplateById(string $id): ?Template
    {
        Log::info('TemplateService::getTemplateById - Finding template', [
            'template_id' => $id,
        ]);

        return $this->templateRepository->getById($id);
    }

    /**
     * Create new template dengan items
     */
    public function createTemplate(array $data): Template
    {
        Log::info('TemplateService::createTemplate - Starting template creation', [
            'data' => $data,
        ]);

        try {
            // Validate data
            $validator = Validator::make($data, [
                'name' => 'required|string|max:255',
                'is_active' => 'sometimes|boolean',
                'variants' => 'sometimes|array',
                'variants.*' => 'required|string|exists:product_variants,id',
            ]);

            if ($validator->fails()) {
                Log::warning('TemplateService::createTemplate - Validation failed', [
                    'errors' => $validator->errors()->toArray(),
                ]);
                throw new \InvalidArgumentException($validator->errors()->first());
            }

            $template = $this->templateRepository->create($data);

            Log::info('TemplateService::createTemplate - Template created successfully', [
                'template_id' => $template->id,
                'template_name' => $template->name,
            ]);

            return $template;
        } catch (\InvalidArgumentException $e) {
            Log::error('TemplateService::createTemplate - Validation error', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('TemplateService::createTemplate - Failed to create template', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Update template dan items
     */
    public function updateTemplate(string $id, array $data): bool
    {
        Log::info('TemplateService::updateTemplate - Starting template update', [
            'template_id' => $id,
            'data' => $data,
        ]);

        try {
            // Check if template exists
            $template = $this->templateRepository->getById($id);
            if (!$template) {
                Log::warning('TemplateService::updateTemplate - Template not found', [
                    'template_id' => $id,
                ]);
                throw new \Exception('Template not found');
            }

            // Validate data
            $validator = Validator::make($data, [
                'name' => 'required|string|max:255',
                'is_active' => 'sometimes|boolean',
                'variants' => 'sometimes|array',
                'variants.*' => 'required|string|exists:product_variants,id',
            ]);

            if ($validator->fails()) {
                Log::warning('TemplateService::updateTemplate - Validation failed', [
                    'errors' => $validator->errors()->toArray(),
                ]);
                throw new \InvalidArgumentException($validator->errors()->first());
            }

            $result = $this->templateRepository->update($id, $data);

            if ($result) {
                Log::info('TemplateService::updateTemplate - Template updated successfully', [
                    'template_id' => $id,
                ]);
            } else {
                Log::warning('TemplateService::updateTemplate - Template update failed', [
                    'template_id' => $id,
                ]);
            }

            return $result;
        } catch (\InvalidArgumentException $e) {
            Log::error('TemplateService::updateTemplate - Validation error', [
                'error' => $e->getMessage(),
                'template_id' => $id,
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('TemplateService::updateTemplate - Failed to update template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Soft delete template
     */
    public function deleteTemplate(string $id): bool
    {
        Log::info('TemplateService::deleteTemplate - Starting template deletion', [
            'template_id' => $id,
        ]);

        try {
            // Check if template exists
            $template = $this->templateRepository->getById($id);
            if (!$template) {
                Log::warning('TemplateService::deleteTemplate - Template not found', [
                    'template_id' => $id,
                ]);
                throw new \Exception('Template not found');
            }

            // Validate: Template tidak boleh aktif
            if ($template->is_active) {
                Log::warning('TemplateService::deleteTemplate - Cannot delete active template', [
                    'template_id' => $id,
                ]);
                throw new \Exception('Cannot delete active template. Please deactivate it first.');
            }

            // TODO: Validasi: Template tidak boleh digunakan dalam record stock keluar
            // (akan diimplementasikan setelah tabel stock_keluar tersedia)

            $result = $this->templateRepository->delete($id);

            if ($result) {
                Log::info('TemplateService::deleteTemplate - Template deleted successfully', [
                    'template_id' => $id,
                ]);
            } else {
                Log::warning('TemplateService::deleteTemplate - Template deletion failed', [
                    'template_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('TemplateService::deleteTemplate - Failed to delete template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Force delete template
     */
    public function forceDeleteTemplate(string $id): bool
    {
        Log::info('TemplateService::forceDeleteTemplate - Starting permanent template deletion', [
            'template_id' => $id,
        ]);

        try {
            $result = $this->templateRepository->forceDelete($id);

            if ($result) {
                Log::info('TemplateService::forceDeleteTemplate - Template permanently deleted', [
                    'template_id' => $id,
                ]);
            } else {
                Log::warning('TemplateService::forceDeleteTemplate - Permanent deletion failed', [
                    'template_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('TemplateService::forceDeleteTemplate - Failed to permanently delete template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Restore deleted template
     */
    public function restoreTemplate(string $id): bool
    {
        Log::info('TemplateService::restoreTemplate - Starting template restoration', [
            'template_id' => $id,
        ]);

        try {
            $result = $this->templateRepository->restore($id);

            if ($result) {
                Log::info('TemplateService::restoreTemplate - Template restored successfully', [
                    'template_id' => $id,
                ]);
            } else {
                Log::warning('TemplateService::restoreTemplate - Template restoration failed', [
                    'template_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('TemplateService::restoreTemplate - Failed to restore template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Get active template
     */
    public function getActiveTemplate(): ?Template
    {
        Log::info('TemplateService::getActiveTemplate - Fetching active template');

        return $this->templateRepository->getActiveTemplate();
    }

    /**
     * Set template as active
     */
    public function setActiveTemplate(string $id): bool
    {
        Log::info('TemplateService::setActiveTemplate - Setting template as active', [
            'template_id' => $id,
        ]);

        try {
            // Check if template exists
            $template = $this->templateRepository->getById($id);
            if (!$template) {
                Log::warning('TemplateService::setActiveTemplate - Template not found', [
                    'template_id' => $id,
                ]);
                throw new \Exception('Template not found');
            }

            $result = $this->templateRepository->setActiveTemplate($id);

            if ($result) {
                // Clear the active template cache
                Cache::forget('active_template');

                Log::info('TemplateService::setActiveTemplate - Template set as active successfully', [
                    'template_id' => $id,
                ]);
            } else {
                Log::warning('TemplateService::setActiveTemplate - Failed to set template as active', [
                    'template_id' => $id,
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('TemplateService::setActiveTemplate - Failed to set active template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Get template with variants
     */
    public function getTemplateWithVariants(string $id): ?Template
    {
        Log::info('TemplateService::getTemplateWithVariants - Fetching template with variants', [
            'template_id' => $id,
        ]);

        return $this->templateRepository->getWithVariants($id);
    }

    /**
     * Search templates
     */
    public function searchTemplates(string $keyword): array
    {
        Log::info('TemplateService::searchTemplates - Searching templates', [
            'keyword' => $keyword,
        ]);

        return $this->templateRepository->search($keyword);
    }
}
