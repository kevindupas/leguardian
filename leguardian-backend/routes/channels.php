<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for bracelet updates
Broadcast::private('bracelet.{bracelet_id}', function ($user, $bracelet_id) {
    // Check if the user is the guardian of this bracelet
    return $user->bracelets()->where('id', $bracelet_id)->exists();
});
