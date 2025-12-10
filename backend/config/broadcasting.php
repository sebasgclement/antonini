<?php

return [

    'default' => 'reverb', // 🔥 FORZAMOS EL DRIVER REVERB

    'connections' => [

        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'cluster' => env('PUSHER_APP_CLUSTER'),
                'useTLS' => true,
            ],
        ],

        'abner' => [
            'driver' => 'abner',
        ],

        // 👇 ACÁ ESTÁ LA SOLUCIÓN. DATOS HARDCODEADOS.
        'reverb' => [
            'driver' => 'reverb',
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'app_id' => env('REVERB_APP_ID'),
            'options' => [
                'host' => '127.0.0.1',   // IP Directa (sin env)
                'port' => 9000,          // Puerto 9000 (sin env)
                'scheme' => 'http',      // HTTP (sin S)
                'useTLS' => false,       // TLS Apagado
            ],
            'client_options' => [
                // Esto evita que falle si no hay certificados SSL
                'verify' => false, 
            ],
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];