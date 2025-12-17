<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:guardians',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $guardian = Guardian::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $guardian->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $guardian,
            'token' => $token,
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $guardian = Guardian::where('email', $request->email)->first();

        if (!$guardian || !Hash::check($request->password, $guardian->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $guardian->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $guardian,
            'token' => $token,
        ]);
    }

    /**
     * Get current user
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Update Expo Push Token
     */
    public function updateFcmToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'expo_push_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $request->user()->update(['expo_push_token' => $request->expo_push_token]);

        return response()->json(['message' => 'Expo push token updated']);
    }
}
