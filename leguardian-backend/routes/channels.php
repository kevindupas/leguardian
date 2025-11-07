<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for bracelet updates
Broadcast::private('bracelet.{bracelet_id}', function ($user, $bracelet_id) {
    \Log::error('🔐 BRACELET CHANNEL AUTH CHECK', [
        'user' => $user ? 'FOUND' : 'NULL',
        'user_id' => $user?->id,
        'user_email' => $user?->email,
        'bracelet_id' => $bracelet_id,
        'user_bracelets' => $user ? $user->bracelets()->pluck('id')->toArray() : [],
    ]);

    // Check if the user is the guardian of this bracelet
    if (!$user) {
        \Log::error('❌ NO USER FOUND - AUTHORIZATION FAILED');
        return false;
    }

    $isAuthorized = $user->bracelets()->where('id', $bracelet_id)->exists();
    \Log::info('✓ Bracelet channel authorization', [
        'user_id' => $user->id,
        'bracelet_id' => $bracelet_id,
        'authorized' => $isAuthorized,
    ]);
    return $isAuthorized;
});
