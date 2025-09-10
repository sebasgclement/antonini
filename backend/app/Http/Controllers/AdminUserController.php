<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminUserController extends Controller
{
    // GET /admin/users?search=&page=
    public function index(Request $req)
    {
        $q = User::query()->with(['roles:id,name']);

        if ($s = trim((string)$req->get('search'))) {
            $q->where(function ($qq) use ($s) {
                $qq->where('name', 'like', "%{$s}%")
                   ->orWhere('email', 'like', "%{$s}%");
            });
        }

        $perPage = (int) $req->get('per_page', 10);
        $page    = (int) $req->get('page', 1);
        $p = $q->orderByDesc('id')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data'      => $p->items(),
            'last_page' => $p->lastPage(),
        ]);
    }

    // POST /admin/users
    public function store(Request $req)
    {
        $data = $req->validate([
            'name'     => ['required','string','max:255'],
            'email'    => ['required','email','max:255','unique:users,email'],
            'password' => ['required','string','min:6'],
            'role'     => ['required','string', Rule::exists('roles','name')],
        ]);

        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            $roleId = Role::where('name', $data['role'])->value('id');
            if ($roleId) $user->roles()->sync([$roleId]);

            $user->load('roles:id,name');
            return response()->json($user, 201);
        });
    }

    // GET /admin/users/{user}
    public function show(User $user)
    {
        $user->load('roles:id,name');
        return response()->json($user);
    }

    // PUT /admin/users/{user}
    public function update(Request $req, User $user)
    {
        $data = $req->validate([
            'name'     => ['required','string','max:255'],
            'email'    => ['required','email','max:255', Rule::unique('users','email')->ignore($user->id)],
            'password' => ['nullable','string','min:6'],
            'role'     => ['required','string', Rule::exists('roles','name')],
        ]);

        return DB::transaction(function () use ($data, $user) {
            $user->name  = $data['name'];
            $user->email = $data['email'];
            if (!empty($data['password'])) {
                $user->password = Hash::make($data['password']);
            }
            $user->save();

            $roleId = Role::where('name', $data['role'])->value('id');
            if ($roleId) $user->roles()->sync([$roleId]);

            $user->load('roles:id,name');
            return response()->json($user);
        });
    }

    // DELETE /admin/users/{user}
    public function destroy(User $user)
    {
        return DB::transaction(function () use ($user) {
            $user->roles()->detach();
            $user->delete();
            return response()->json(['ok' => true]);
        });
    }

    // GET /admin/roles
    public function roles()
    {
        return Role::orderBy('name')->get(['id','name']);
    }
}
