<?php

namespace App\Providers;

use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\TemplateRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Product\ProductRepository;
use App\Repositories\Template\TemplateRepository;
use App\Repositories\User\UserRepository;
use App\Services\Contracts\ProductServiceInterface;
use App\Services\Contracts\TemplateServiceInterface;
use App\Services\Contracts\UserServiceInterface;
use App\Services\Product\ProductService;
use App\Services\Template\TemplateService;
use App\Services\User\UserService;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind Repository Interfaces
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, ProductRepository::class);
        $this->app->bind(TemplateRepositoryInterface::class, TemplateRepository::class);

        // Bind Service Interfaces
        $this->app->bind(UserServiceInterface::class, UserService::class);
        $this->app->bind(ProductServiceInterface::class, ProductService::class);
        $this->app->bind(TemplateServiceInterface::class, TemplateService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
