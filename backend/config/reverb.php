<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Reverb Server
    |--------------------------------------------------------------------------
    |
    | This option controls the default server that will be used by Reverb
    | when starting the server. You may specify any of the servers
    | defined in the "servers" configuration array below.
    |
    */

    'default' => env('REVERB_SERVER', 'reverb'),

    /*
    |--------------------------------------------------------------------------
    | Reverb Servers
    |--------------------------------------------------------------------------
    |
    | Here you may define the configuration for each of the Reverb servers
    | that your application supports. You may define as many servers
    | as you wish, and you may even define multiple servers with
    | the same driver.
    |
    */

    'servers' => [

        'reverb' => [
            'host' => env('REVERB_HOST', '0.0.0.0'),
            'port' => env('REVERB_PORT', 8080),
            'hostname' => env('REVERB_HOST'),
            'options' => [
                'tls' => [],
            ],
            'max_request_size' => env('REVERB_MAX_REQUEST_SIZE', 10_000),
            'scaling' => [
                'enabled' => env('REVERB_SCALING_ENABLED', false),
                'channel' => env('REVERB_SCALING_CHANNEL', 'reverb'),
            ],
            'pulse_ingest_interval' => 15,
            'telescope_ingest_interval' => 15,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Reverb Applications
    |--------------------------------------------------------------------------
    |
    | Here you may define the applications that may connect to your Reverb
    | server. Each application must have a unique ID, key, and secret
    | that will be used to authenticate connections.
    |
    */

    'apps' => [

        'provider' => 'config',

        'apps' => [
            [
                // 🔥 CORRECCIÓN: Reverb busca "app_id", no solo "id"
                'app_id' => env('REVERB_APP_ID'),
                'id' => env('REVERB_APP_ID'), // Dejamos también 'id' por si las dudas, no molesta
                
                'key' => env('REVERB_APP_KEY'),
                'secret' => env('REVERB_APP_SECRET'),
                'options' => [
                    'host' => env('REVERB_HOST'),
                    'port' => env('REVERB_PORT', 9000),
                    'scheme' => env('REVERB_SCHEME', 'http'),
                    'useTLS' => env('REVERB_SCHEME', 'https') === 'https',
                ],
                'allowed_origins' => ['*'],
                'ping_interval' => 60,
                'max_message_size' => env('REVERB_MAX_REQUEST_SIZE', 10_000),
            ],
        ],

    ],

];