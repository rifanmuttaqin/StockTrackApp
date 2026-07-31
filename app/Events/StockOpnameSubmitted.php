<?php

namespace App\Events;

use App\Models\StockOpnameRecord;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockOpnameSubmitted
{
    use Dispatchable, SerializesModels;

    /**
     * The stock opname record instance.
     *
     * @var StockOpnameRecord
     */
    public StockOpnameRecord $record;

    /**
     * Create a new event instance.
     */
    public function __construct(StockOpnameRecord $record)
    {
        $this->record = $record;
    }
}
