<?php

namespace App\Http\Controllers\Notification;

use App\Http\Controllers\Controller;
use App\Services\StockThresholdService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private StockThresholdService $thresholdService
    ) {}

    /**
     * Display notifications page.
     */
    public function index(Request $request): Response
    {
        try {
            $user = Auth::user();
            $statusFilter = $request->get('status', 'all');
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 15);

            $query = $user->notifications();

            // Filter by status
            if ($statusFilter === 'unread') {
                $query->whereNull('read_at');
            } elseif ($statusFilter === 'read') {
                $query->whereNotNull('read_at');
            }

            $paginated = $query->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Transform notifications to include parsed data
            $notifications = collect($paginated->items())->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                    'updated_at' => $notification->updated_at,
                ];
            });

            $pagination = [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
            ];

            $unreadCount = $user->unreadNotifications()->count();

            return Inertia::render('Notifications/Index', [
                'notifications' => $notifications,
                'pagination' => $pagination,
                'unreadCount' => $unreadCount,
                'filters' => [
                    'status' => $statusFilter,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch notifications', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('Notifications/Index', [
                'notifications' => [],
                'pagination' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 15,
                    'total' => 0,
                    'from' => null,
                    'to' => null,
                ],
                'unreadCount' => 0,
                'filters' => [
                    'status' => 'all',
                ],
                'error' => 'Gagal memuat notifikasi. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Get unread notifications (API endpoint for polling).
     */
    public function getUnread(Request $request)
    {
        try {
            $limit = $request->get('limit', 5);
            $notifications = $this->thresholdService->getUnreadNotifications((int) $limit);

            // Transform to include parsed data
            $data = $notifications->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch unread notifications', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat notifikasi.',
            ], 500);
        }
    }

    /**
     * Get unread notifications count (API endpoint for badge).
     */
    public function getUnreadCount()
    {
        try {
            $count = $this->thresholdService->getUnreadCount();

            return response()->json([
                'success' => true,
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch unread count', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'count' => 0,
            ], 500);
        }
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(string $id)
    {
        try {
            $result = $this->thresholdService->markAsRead($id);

            if (!$result) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notifikasi tidak ditemukan.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Notifikasi ditandai sebagai dibaca.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark notification as read', [
                'error' => $e->getMessage(),
                'notification_id' => $id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui notifikasi.',
            ], 500);
        }
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        try {
            $count = $this->thresholdService->markAllAsRead();

            return response()->json([
                'success' => true,
                'message' => "{$count} notifikasi ditandai sebagai dibaca.",
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark all notifications as read', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui notifikasi.',
            ], 500);
        }
    }
}
