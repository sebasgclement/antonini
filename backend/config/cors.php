<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/*',],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://antoniniautomotores.com.ar',      // 👈 PRODUCCIÓN (Fundamental)
        'https://www.antoniniautomotores.com.ar',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
