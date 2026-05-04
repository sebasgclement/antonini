<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/*', 'login', 'logout'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
	'http://134.122.7.86',
	'http://134.122.7.86:8080',
        'https://antoniniautomotores.com.ar',
        'https://www.antoniniautomotores.com.ar',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
