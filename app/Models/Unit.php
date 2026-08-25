<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Unit extends Model
{
    /** @use HasFactory<\Database\Factories\UnitFactory> */
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Boot function for using with Unit Events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'abbreviation',
        'type',
        'base_unit_id',
        'multiplier',
        'is_primary',
        'description',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'full_name',
        'variants_count',
    ];

    /**
     * Get attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'string',
            'base_unit_id' => 'string',
            'multiplier' => 'decimal:2',
            'is_primary' => 'boolean',
        ];
    }

    /**
     * Get the base unit that this conversion unit references.
     */
    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    /**
     * Get conversion units that reference this base unit.
     */
    public function conversions(): HasMany
    {
        return $this->hasMany(Unit::class, 'base_unit_id');
    }

    /**
     * Get variants that use this unit.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'unit_id');
    }

    /**
     * Scope a query to only include base units.
     */
    public function scopeBase($query)
    {
        return $query->where('type', 'base');
    }

    /**
     * Scope a query to only include conversion units.
     */
    public function scopeConversion($query)
    {
        return $query->where('type', 'conversion');
    }

    /**
     * Scope a query to only include active (non-deleted) units.
     */
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    /**
     * Get the full name for conversion units (e.g., "1 Karton = 10 Pcs").
     *
     * @return string|null
     */
    public function getFullNameAttribute(): ?string
    {
        if ($this->type !== 'conversion' || !$this->baseUnit) {
            return null;
        }

        return "1 {$this->name} = {$this->multiplier} {$this->baseUnit->abbreviation}";
    }

    /**
     * Get the count of variants using this unit.
     *
     * @return int
     */
    public function getVariantsCountAttribute(): int
    {
        return $this->variants()->count();
    }
}
