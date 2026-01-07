<?php

namespace App\Http\Controllers\Template;

use App\Http\Controllers\Controller;
use App\Http\Requests\Template\TemplateCreateRequest;
use App\Http\Requests\Template\TemplateDeleteRequest;
use App\Http\Requests\Template\TemplateSetActiveRequest;
use App\Http\Requests\Template\TemplateUpdateRequest;
use App\Models\ProductVariant;
use App\Services\Contracts\TemplateServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    protected TemplateServiceInterface $templateService;

    public function __construct(TemplateServiceInterface $templateService)
    {
        $this->templateService = $templateService;

        // Permission middleware
        $this->middleware('permission:templates.view')->only(['index', 'show']);
        $this->middleware('permission:templates.create')->only(['create', 'store']);
        $this->middleware('permission:templates.update')->only(['edit', 'update', 'setActive']);
        $this->middleware('permission:templates.delete')->only(['destroy', 'restore', 'forceDelete']);
    }

    /**
     * Check if user has specific role
     */
    private function userHasRole($user, string $role): bool
    {
        return $user->roles()->where('name', $role)->exists();
    }

    /**
     * Check if user has specific permission
     */
    private function userHasPermission($user, string $permission): bool
    {
        return $user->permissions()->where('name', $permission)->exists() ||
               $user->roles()->whereHas('permissions', function ($query) use ($permission) {
                   $query->where('name', $permission);
               })->exists();
    }

    /**
     * Log template management actions for audit trail
     */
    private function logTemplateAction(string $action, string $templateId, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('Template Management Action', [
            'action' => $action,
            'performed_by' => $currentUser->id,
            'performed_by_name' => $currentUser->name,
            'template_id' => $templateId,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Display a listing of templates
     */
    public function index(Request $request): Response
    {
        try {
            $search = $request->get('search', '');

            $templates = collect($this->templateService->getAllTemplates());

            // Filter by search keyword if provided
            if (!empty($search)) {
                $templates = $templates->filter(function ($template) use ($search) {
                    return stripos($template['name'], $search) !== false;
                });
            }

            // Calculate total items and active count across all templates
            $totalItems = 0;
            $activeCount = 0;
            foreach ($templates as $template) {
                $totalItems += $template['variants_count'] ?? 0;
                if ($template['is_active'] ?? false) {
                    $activeCount++;
                }
            }

            // Get template statistics for meta data
            $meta = [
                'total' => $templates->count(),
                'total_variants' => $totalItems,
                'active_count' => $activeCount,
                'search' => $search,
                'current_page' => 1,
                'last_page' => 1,
                'from' => $templates->count() > 0 ? 1 : 0,
                'to' => $templates->count(),
            ];

            $this->logTemplateAction('view_template_list', 'all', [
                'search' => $search,
            ]);

            return Inertia::render('Templates/Index', [
                'templates' => [
                    'data' => $templates->values(),
                ],
                'filters' => [
                    'search' => $search,
                ],
                'meta' => $meta,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch templates', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('Templates/Index', [
                'templates' => [],
                'filters' => [
                    'search' => '',
                ],
                'meta' => [],
                'error' => 'Gagal memuat data template. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Show form for creating a new template
     */
    public function create(): Response
    {
        try {
            // Get all product variants with eager loading
            $productVariants = ProductVariant::with('product')
                ->whereHas('product', function ($query) {
                    $query->whereNull('deleted_at');
                })
                ->whereNull('deleted_at')
                ->get();

            return Inertia::render('Templates/Create', [
                'productVariants' => $productVariants,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load product variants for template creation', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('Templates/Create', [
                'productVariants' => [],
                'error' => 'Gagal memuat data varian produk. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Store a newly created template
     */
    public function store(TemplateCreateRequest $request)
    {
        try {
            $validatedData = $request->validated();
            $template = $this->templateService->createTemplate($validatedData);

            $this->logTemplateAction('create_template', $template->id, [
                'name' => $template->name,
                'is_active' => $template->is_active,
                'variants_count' => count($validatedData['variants'] ?? []),
            ]);

            return redirect()->route('templates.index')
                ->with('success', 'Template berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Failed to create template', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal menambahkan template. ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Display specified template
     */
    public function show(string $id): Response
    {
        try {
            $template = $this->templateService->getTemplateWithVariants($id);

            if (!$template) {
                abort(404, 'Template tidak ditemukan.');
            }

            $this->logTemplateAction('view_template_detail', $id);

            return Inertia::render('Templates/Show', [
                'template' => $template,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch template detail', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Template tidak ditemukan.');
        }
    }

    /**
     * Show form for editing specified template
     */
    public function edit(string $id): Response
    {
        try {
            $template = $this->templateService->getTemplateWithVariants($id);

            if (!$template) {
                abort(404, 'Template tidak ditemukan.');
            }

            // Get all product variants with eager loading
            $productVariants = ProductVariant::with('product')
                ->whereHas('product', function ($query) {
                    $query->whereNull('deleted_at');
                })
                ->whereNull('deleted_at')
                ->get();

            $this->logTemplateAction('view_template_edit_form', $id);

            return Inertia::render('Templates/Edit', [
                'template' => $template,
                'productVariants' => $productVariants,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch template for edit', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            abort(404, 'Template tidak ditemukan.');
        }
    }

    /**
     * Update specified template
     */
    public function update(TemplateUpdateRequest $request, string $id)
    {
        try {
            $validatedData = $request->validated();

            Log::info('Template Update Request Data', [
                'template_id' => $id,
                'validated_data' => $validatedData,
            ]);

            $success = $this->templateService->updateTemplate($id, $validatedData);

            if ($success) {
                $this->logTemplateAction('update_template', $id, [
                    'updated_fields' => array_keys($validatedData),
                    'variants_count' => count($validatedData['variants'] ?? []),
                ]);

                return redirect()->route('templates.index')
                    ->with('success', 'Template berhasil diperbarui.');
            }

            return redirect()->back()
                ->with('error', 'Gagal memperbarui template.')
                ->withInput();
        } catch (ValidationException $e) {
            Log::error('Validation failed during template update', [
                'error' => $e->getMessage(),
                'errors' => $e->errors(),
                'template_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to update template', [
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'template_id' => $id,
                'data' => $request->validated(),
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal memperbarui template. ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove specified template (soft delete)
     */
    public function destroy(string $id)
    {
        try {
            $template = $this->templateService->getTemplateById($id);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template tidak ditemukan.',
                ], 404);
            }

            $success = $this->templateService->deleteTemplate($id);

            if ($success) {
                $this->logTemplateAction('soft_delete_template', $id, [
                    'name' => $template->name,
                    'is_active' => $template->is_active,
                    'items_count' => $template->variants->count(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Template berhasil dihapus (soft delete).',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus template.',
            ], 500);
        } catch (\Exception $e) {
            Log::error('Failed to soft delete template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus template. ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Set template as active
     */
    public function setActive(TemplateSetActiveRequest $request, string $id)
    {
        try {
            $success = $this->templateService->setActiveTemplate($id);

            if ($success) {
                $this->logTemplateAction('set_active_template', $id);

                return redirect()->route('templates.index')
                    ->with('success', 'Template berhasil diaktifkan.');
            }

            return redirect()->back()
                ->with('error', 'Gagal mengaktifkan template.')
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to set active template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('error', 'Gagal mengaktifkan template. ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Restore soft deleted template
     */
    public function restore(string $id)
    {
        try {
            $success = $this->templateService->restoreTemplate($id);

            if ($success) {
                $this->logTemplateAction('restore_template', $id);

                return response()->json([
                    'success' => true,
                    'message' => 'Template berhasil dipulihkan.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal memulihkan template.',
            ], 500);
        } catch (\Exception $e) {
            Log::error('Failed to restore template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memulihkan template. ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Permanently delete template (force delete)
     */
    public function forceDelete(string $id)
    {
        try {
            $success = $this->templateService->forceDeleteTemplate($id);

            if ($success) {
                $this->logTemplateAction('force_delete_template', $id);

                return response()->json([
                    'success' => true,
                    'message' => 'Template berhasil dihapus permanen.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus permanen template.',
            ], 500);
        } catch (\Exception $e) {
            Log::error('Failed to force delete template', [
                'error' => $e->getMessage(),
                'template_id' => $id,
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus permanen template. ' . $e->getMessage(),
            ], 500);
        }
    }
}
