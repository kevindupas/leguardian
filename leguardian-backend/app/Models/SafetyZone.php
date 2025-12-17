<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SafetyZone extends Model
{
    use HasFactory;

    protected $fillable = [
        'bracelet_id',
        'created_by_guardian_id',
        'name',
        'icon',
        'coordinates',
        'notify_on_entry',
        'notify_on_exit',
    ];

    protected $casts = [
        'coordinates' => 'json',
        'notify_on_entry' => 'boolean',
        'notify_on_exit' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations
    public function bracelet()
    {
        return $this->belongsTo(Bracelet::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(Guardian::class, 'created_by_guardian_id');
    }
}
