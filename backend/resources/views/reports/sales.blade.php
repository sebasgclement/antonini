<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reporte de Ventas {{ $year }}</title>
  <style>
    body {
      font-family: DejaVu Sans, sans-serif;
      font-size: 12px;
      color: #333;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #444;
      padding-bottom: 10px;
    }
    header img {
      height: 50px;
    }
    h1 {
      font-size: 20px;
      text-align: right;
      color: #222;
      margin: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: #f2f2f2;
      font-weight: bold;
    }
    tfoot td {
      border-top: 2px solid #555;
      font-weight: bold;
      background: #f9f9f9;
    }
    .right { text-align: right; }
  </style>
</head>
<body>
  <header>
    <img src="{{ public_path('antonini-logo-white-h160-safe.png') }}" alt="Antonini">
    <h1>Reporte de Ventas {{ $year }}</h1>
  </header>

  <p><strong>Vendedor:</strong> {{ $seller }}</p>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Fecha</th>
        <th>Vehículo</th>
        <th>Cliente</th>
        <th>Forma de pago</th>
        <th class="right">Precio</th>
        <th class="right">Valor usado</th>
        <th class="right">Gastos taller</th>
        <th class="right">Ganancia</th>
      </tr>
    </thead>
    <tbody>
      @foreach($reservas as $r)
      <tr>
        <td>{{ $r->id }}</td>
        <td>{{ $r->date?->format('d/m/Y') }}</td>
        <td>{{ $r->vehicle?->brand }} {{ $r->vehicle?->model }}</td>
        <td>{{ $r->customer?->first_name }} {{ $r->customer?->last_name }}</td>
        <td>{{ ucfirst(str_replace('_',' ', $r->payment_method)) }}</td>
        <td class="right">${{ number_format($r->price, 2, ',', '.') }}</td>
        <td class="right">${{ number_format($r->usedVehicle?->price ?? 0, 2, ',', '.') }}</td>
        <td class="right">${{ number_format($r->workshop_expenses ?? 0, 2, ',', '.') }}</td>
        <td class="right">${{ number_format($r->profit, 2, ',', '.') }}</td>
      </tr>
      @endforeach
    </tbody>
    <tfoot>
      <tr>
        <td colspan="5" class="right">Totales:</td>
        <td class="right">${{ number_format($totalVentas, 2, ',', '.') }}</td>
        <td colspan="2"></td>
        <td class="right">${{ number_format($totalGanancia, 2, ',', '.') }}</td>
      </tr>
    </tfoot>
  </table>

  <p style="margin-top: 40px; text-align:center; color:#777;">
    © {{ date('Y') }} Antonini Automotores — Reporte generado automáticamente
  </p>
</body>
</html>
