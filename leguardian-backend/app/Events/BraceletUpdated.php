<?php

namespace App\Events;

use App\Models\Bracelet;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BraceletUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Bracelet $bracelet;
    public array $changes;

    /**
     * Create a new event instance.
     */
    public function __construct(Bracelet $bracelet, array $changes = [])
    {
        $this->bracelet = $bracelet;
        $this->changes = $changes;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('bracelet.' . $this->bracelet->id),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'bracelet' => [
                'id' => $this->bracelet->id,
                'unique_code' => $this->bracelet->unique_code,
                'alias' => $this->bracelet->alias ?? $this->bracelet->name,
                'status' => $this->bracelet->status,
                'battery_level' => $this->bracelet->battery_level,
                'last_latitude' => $this->bracelet->last_latitude,
                'last_longitude' => $this->bracelet->last_longitude,
                'last_accuracy' => $this->bracelet->last_accuracy,
                'last_location_update' => $this->bracelet->last_location_update?->toIso8601String(),
                'last_ping_at' => $this->bracelet->last_ping_at?->toIso8601String(),
            ],
            'changes' => $this->changes,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * The name of the event to broadcast as.
     */
    public function broadcastAs(): string
    {
        return 'bracelet.updated';
    }
}
