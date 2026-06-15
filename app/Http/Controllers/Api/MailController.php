<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Webklex\PHPIMAP\ClientManager;

class MailController extends Controller
{
    private function makeClient(User $user)
    {
        $cm = new ClientManager();

        return $cm->make([
            'host'          => config('services.imap.host'),
            'port'          => (int) config('services.imap.port', 993),
            'encryption'    => config('services.imap.encryption', 'ssl'),
            'validate_cert' => false,
            'username'      => $user->mail_address,
            'password'      => $user->imap_password,
            'protocol'      => 'imap',
        ]);
    }

    private function checkConfigured(User $user): ?JsonResponse
    {
        if (!$user->mail_address || !$user->imap_password) {
            return response()->json(['error' => 'not_configured'], 422);
        }
        return null;
    }

    public function inbox(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($err = $this->checkConfigured($user)) return $err;

        $folder  = $request->get('folder', 'INBOX');
        $page    = max(1, (int) $request->get('page', 1));
        $perPage = 30;

        try {
            $client = $this->makeClient($user);
            $client->connect();

            $f        = $client->getFolder($folder);
            $all      = $f->query()->all()->setFetchOrder('desc')->leaveUnread()->get();
            $total    = $all->count();
            $messages = $all->slice(($page - 1) * $perPage, $perPage)->values();

            $items = $messages->map(function ($msg) {
                $from = $msg->getFrom();
                return [
                    'uid'       => $msg->getUid(),
                    'from'      => $from->count() ? $from->first()->mail : '',
                    'from_name' => $from->count() ? ($from->first()->personal ?: $from->first()->mail) : '',
                    'subject'   => (string) $msg->getSubject() ?: '(sin asunto)',
                    'date'      => optional($msg->getDate()->first())->toDateTimeString(),
                    'is_read'   => $msg->getFlags()->contains('Seen'),
                ];
            })->toArray();

            $client->disconnect();

            return response()->json([
                'messages'  => $items,
                'total'     => $total,
                'page'      => $page,
                'per_page'  => $perPage,
                'last_page' => (int) ceil($total / max($perPage, 1)),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'connection_failed',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function show(Request $request, string $uid): JsonResponse
    {
        $user = $request->user();

        if ($err = $this->checkConfigured($user)) return $err;

        $folder = $request->get('folder', 'INBOX');

        try {
            $client = $this->makeClient($user);
            $client->connect();

            $f   = $client->getFolder($folder);
            $msg = $f->query()->getMessageByUid((int) $uid);

            if (!$msg) {
                $client->disconnect();
                return response()->json(['error' => 'not_found'], 404);
            }

            $msg->setFlag('Seen');

            $from = $msg->getFrom();
            $to   = $msg->getTo();
            $body = $msg->getHTMLBody() ?: nl2br(htmlspecialchars((string) $msg->getTextBody()));

            $data = [
                'uid'       => $msg->getUid(),
                'from'      => $from->count() ? $from->first()->mail : '',
                'from_name' => $from->count() ? ($from->first()->personal ?: $from->first()->mail) : '',
                'to'        => $to->count() ? $to->first()->mail : '',
                'subject'   => (string) $msg->getSubject() ?: '(sin asunto)',
                'date'      => optional($msg->getDate()->first())->toDateTimeString(),
                'body'      => $body,
            ];

            $client->disconnect();

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'connection_failed',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($err = $this->checkConfigured($user)) return $err;

        $data = $request->validate([
            'to'      => ['required', 'email'],
            'subject' => ['required', 'string', 'max:255'],
            'body'    => ['required', 'string'],
        ]);

        try {
            $smtpHost = config('services.imap.smtp_host');
            $smtpPort = (int) config('services.imap.smtp_port', 587);
            $enc      = config('services.imap.smtp_encryption', 'tls');

            $scheme = ($smtpPort === 465 || $enc === 'ssl') ? 'smtps' : 'smtp';
            $dsn    = sprintf('%s://%s:%s@%s:%d',
                $scheme,
                rawurlencode($user->mail_address),
                rawurlencode($user->imap_password),
                $smtpHost,
                $smtpPort
            );

            $transport = Transport::fromDsn($dsn);
            $mailer    = new Mailer($transport);

            $email = (new Email())
                ->from(new Address($user->mail_address, $user->name))
                ->to($data['to'])
                ->subject($data['subject'])
                ->html($data['body'])
                ->text(strip_tags($data['body']));

            $mailer->send($email);

            return response()->json(['ok' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'send_failed',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function saveConfig(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'mail_address'  => ['required', 'email'],
            'imap_password' => ['required', 'string', 'min:1'],
        ]);

        $user->update($data);

        return response()->json(['ok' => true, 'mail_address' => $user->mail_address]);
    }

    public function deleteMessage(Request $request, string $uid): JsonResponse
    {
        $user   = $request->user();
        $folder = $request->get('folder', 'INBOX');

        if ($err = $this->checkConfigured($user)) return $err;

        try {
            $client = $this->makeClient($user);
            $client->connect();

            $f   = $client->getFolder($folder);
            $msg = $f->query()->getMessageByUid((int) $uid);

            if ($msg) {
                $msg->delete(true);
            }

            $client->disconnect();

            return response()->json(['ok' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'connection_failed',
                'message' => $e->getMessage(),
            ], 503);
        }
    }
}
