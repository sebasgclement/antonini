<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'infoauto' => [
        'username' => env('INFOAUTO_USER'),
        'password' => env('INFOAUTO_PASS'),
    ],

    'imap' => [
        'host'            => env('IMAP_HOST', ''),
        'port'            => env('IMAP_PORT', 993),
        'encryption'      => env('IMAP_ENCRYPTION', 'ssl'),
        'smtp_host'       => env('SMTP_HOST', ''),
        'smtp_port'       => env('SMTP_PORT', 587),
        'smtp_encryption' => env('SMTP_ENCRYPTION', 'tls'),
    ],

];
