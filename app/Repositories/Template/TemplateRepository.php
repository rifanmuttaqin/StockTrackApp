<?php

namespace App\Repositories\Template;

use App\Models\Template;
use App\Models\TemplateItem;
use App\Models\ProductVariant;
use App\Repositories\Contracts\TemplateRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TemplateRepository implements TemplateRepositoryInterface
{
    /**
     * Get all templates
     */
    public function getAll(): array
    {
        return Template::with(['variants', 'items'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($template) {
                return $this->transformTemplate($template);
            })
            ->toArray();
    }

    /**
     * Get template by id
     */
    public function getById(string $id): ?Template
    {
        $template = Template::with(['variants', 'items'])->find($id);

        if (!$template) {
            return null;
        }

        return $template;
    }

    /**
     * Create new template
     */
    public function create(array $data): Template
    {
        DB::beginTransaction();

        try {
            // Create template
            $template = Template::create([
                'name' => $data['name'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Create template items (variants)
            if (isset($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $variantId) {
                    // Validate that variant exists
                    $variant = ProductVariant::find($variantId);
                    if ($variant) {
                        TemplateItem::create([
                            'template_id' => $template->id,
                            'product_variant_id' => $variantId,
                        ]);
                    }
                }
            }

            DB::commit();

            // Load relations
            $template->load(['variants', 'items']);

            return $template;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create template', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            throw $e;
        }
    }

    /**
     * Update template
     */
    public function update(string $id, array $data): bool
    {
        DB::beginTransaction();

        try {
            $template = Template::with(['items'])->findOrFail($id);

            // Update template data
            $template->update([
                'name' => $data['name'],
                'is_active' => $data['is_active'] ?? $template->is_active,
            ]);

            // Update template items (variants)
            if (isset($data['variants']) && is_array($data['variants'])) {
                // Get existing item IDs
                $existingItemIds = $template->items->pluck('product_variant_id')->toArray();

                // Get submitted variant IDs
                $submittedVariantIds = $data['variants'];

                // Delete items that are not in the submitted list
                $itemsToDelete = array_diff($existingItemIds, $submittedVariantIds);
                if (!empty($itemsToDelete)) {
                    TemplateItem::where('template_id', $template->id)
                        ->whereIn('product_variant_id', $itemsToDelete)
                        ->delete();
                }

                // Add new items
                $itemsToAdd = array_diff($submittedVariantIds, $existingItemIds);
                foreach ($itemsToAdd as $variantId) {
                    // Validate that variant exists
                    $variant = ProductVariant::find($variantId);
                    if ($variant) {
                        TemplateItem::create([
                            'template_id' => $template->id,
                            'product_variant_id' => $variantId,
                        ]);
                    }
                }
            }

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'data' => $data,
            ]);
            throw $e;
        }
    }

    /**
     * Soft delete template
     */
    public function delete(string $id): bool
    {
        DB::beginTransaction();

        try {
            $template = Template::findOrFail($id);

            // Soft delete template (cascade will soft delete items)
            $template->delete();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
            ]);
            throw $e;
        }
    }

    /**
     * Force delete template (permanen)
     */
    public function forceDelete(string $id): bool
    {
        DB::beginTransaction();

        try {
            $template = Template::withTrashed()->findOrFail($id);

            if (!$template->trashed()) {
                throw new \Exception('Template must be in deleted status first');
            }

            // Force delete template (cascade will force delete items)
            $template->forceDelete();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to force delete template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
            ]);
            throw $e;
        }
    }

    /**
     * Restore deleted template
     */
    public function restore(string $id): bool
    {
        DB::beginTransaction();

        try {
            $template = Template::withTrashed()->findOrFail($id);

            if (!$template->trashed()) {
                throw new \Exception('Template is not in deleted status');
            }

            // Restore template
            $template->restore();

            // Restore related items
            TemplateItem::withTrashed()
                ->where('template_id', $template->id)
                ->restore();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to restore template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
            ]);
            throw $e;
        }
    }

    /**
     * Get active template
     */
    public function getActiveTemplate(): ?Template
    {
        return Template::active()
            ->with(['variants', 'items'])
            ->first();
    }

    /**
     * Set template as active
     */
    public function setActiveTemplate(string $id): bool
    {
        DB::beginTransaction();

        try {
            $template = Template::findOrFail($id);

            // Deactivate all other templates
            Template::where('id', '!=', $template->id)
                ->update(['is_active' => false]);

            // Activate this template
            $template->is_active = true;
            $template->save();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to set active template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
            ]);
            throw $e;
        }
    }

    /**
     * Get template with variants
     */
    public function getWithVariants(string $id): ?Template
    {
        $template = Template::with(['variants.product' => function ($query) {
            $query->select('products.id', 'products.name');
        }])->find($id);

        if (!$template) {
            return null;
        }

        return $template;
    }

    /**
     * Search templates by name
     */
    public function search(string $keyword): array
    {
        return Template::with(['variants', 'items'])
            ->where('name', 'like', "%{$keyword}%")
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($template) {
                return $this->transformTemplate($template);
            })
            ->toArray();
    }

    /**
     * Transform template to array format
     */
    private function transformTemplate(Template $template): array
    {
        return [
            'id' => $template->id,
            'name' => $template->name,
            'is_active' => $template->is_active,
            'variants_count' => $template->items->count(),
            'variants' => $template->variants->map(function ($variant) {
                return [
                    'id' => $variant->id,
                    'name' => $variant->variant_name,
                    'sku' => $variant->sku,
                    'stock_current' => $variant->stock_current,
                ];
            })->toArray(),
            'created_at' => $template->created_at,
            'updated_at' => $template->updated_at,
        ];
    }
}
