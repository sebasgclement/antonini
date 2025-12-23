<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    */

    'default' => 'log', // 👈 ACÁ FORZAMOS QUE USE LOG

    /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    */

    'connections' => [

        'pusher' => [
            'driver' => 'pusher',
            'key' => 'clave_falsa',    // 👈 Evita el error "null given"
            'secret' => 'secreto_falso',
            'app_id' => 'id_falso',
            'options' => [
                'cluster' => 'mt1',
                'useTLS' => true,
            ],
        ],

        'abner' => [
            'driver' => 'abner',
        ],

        'reverb' => [
            'driver' => 'reverb',
            'key' => 'clave_falsa',
            'secret' => 'secreto_falso',
            'app_id' => 'id_falso',
            'options' => [
                'host' => '127.0.0.1',
                'port' => 443,
                'scheme' => 'https',
                'useTLS' => true,
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