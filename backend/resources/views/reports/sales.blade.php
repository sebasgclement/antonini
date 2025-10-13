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
    <img src="{{ public_path('antonini-logo-white-h160-safe.png') }}" alt="Antonini Automotores">
    <h1>Reporte de Ventas {{ $year }}</h1>
  </header>

  <p>
    <strong>Período:</strong>
    {{ $vehiculos->min('updated_at') ? date('d/m/Y', strtotime($vehiculos->min('updated_at'))) : '-' }}
    al
    {{ $vehiculos->max('updated_at') ? date('d/m/Y', strtotime($vehiculos->max('updated_at'))) : '-' }}
  </p>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Fecha venta</th>
        <th>Marca</th>
        <th>Modelo</th>
        <th>Año</th>
        <th>Patente</th>
        <th>Color</th>
        <th class="right">Precio venta</th>
        <th class="right">Precio referencia</th>
        <th class="right">Ganancia estimada</th>
      </tr>
    </thead>
    <tbody>
      @forelse($vehiculos as $v)
      <tr>
        <td>{{ $v->id }}</td>
        <td>{{ $v->updated_at ? date('d/m/Y', strtotime($v->updated_at)) : '-' }}</td>
        <td>{{ $v->brand }}</td>
        <td>{{ $v->model }}</td>
        <td>{{ $v->year }}</td>
        <td>{{ $v->plate }}</td>
        <td>{{ $v->color }}</td>
        <td class="right">${{ number_format($v->price, 2, ',', '.') }}</td>
        <td class="right">${{ number_format($v->reference_price ?? 0, 2, ',', '.') }}</td>
        <td class="right">${{ number_format(($v->price - ($v->reference_price ?? 0)), 2, ',', '.') }}</td>
      </tr>
      @empty
      <tr>
        <td colspan="10" style="text-align:center;">No se registran vehículos vendidos en este período.</td>
      </tr>
      @endforelse
    </tbody>
    <tfoot>
      <tr>
        <td colspan="7" class="right">Totales:</td>
        <td class="right">${{ number_format($totalVentas, 2, ',', '.') }}</td>
        <td></td>
        <td class="right">${{ number_format($totalGanancia, 2, ',', '.') }}</td>
      </tr>
    </tfoot>
  </table>

  <p style="margin-top: 40px; text-align:center; color:#777;">
    © {{ date('Y') }} Antonini Automotores — Reporte generado automáticamente
  </p>
</body>
</html>
