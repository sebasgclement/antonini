import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Estilos para el PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica", color: "#333" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid #ccc", paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold", textTransform: "uppercase" },
  sectionTitle: { fontSize: 12, fontWeight: "bold", backgroundColor: "#f0f0f0", padding: 4, marginBottom: 8, marginTop: 10 },
  row: { flexDirection: "row", marginBottom: 4 },
  col: { flex: 1 },
  label: { fontWeight: "bold", width: 80, fontSize: 9, color: "#666" },
  value: { flex: 1, fontSize: 10 },
  
  // Tabla de pagos
  tableHeader: { flexDirection: "row", backgroundColor: "#333", color: "#fff", padding: 4, marginTop: 10 },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #eee", padding: 4 },
  th: { fontSize: 9, fontWeight: "bold" },
  td: { fontSize: 9 },
  
  // Totales
  totalsSection: { marginTop: 20, alignSelf: "flex-end", width: "40%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalLabel: { fontWeight: "bold" },
  totalValue: { fontWeight: "bold" },
  balance: { fontSize: 14, fontWeight: "bold", color: "#c00", borderTop: "1px solid #000", paddingTop: 4, marginTop: 4 }
});

// Formateadores
const formatCurrency = (val: number) => `$ ${Number(val || 0).toLocaleString("es-AR")}`;
const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString("es-AR") : "-";

export const ReservationDetailPdf = ({ reservation }: { reservation: any }) => {
  // Cálculos internos para el PDF
  const precioVenta = reservation.price || 0;
  const valorUsado = reservation.usedVehicle?.price || 0;
  const creditoBanco = reservation.credit_bank || 0;
  const totalPagado = reservation.paid_amount || reservation.payments?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
  const saldo = reservation.balance ?? (precioVenta - totalPagado - valorUsado - creditoBanco);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Detalle de Reserva</Text>
            <Text style={{ fontSize: 10, color: "#666" }}>#{reservation.id} - {formatDate(reservation.date)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", textTransform: "uppercase" }}>
              {reservation.status}
            </Text>
          </View>
        </View>

        {/* GRID: CLIENTE Y VEHICULO */}
        <View style={{ flexDirection: "row", gap: 20 }}>
          {/* CLIENTE */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>👤 Cliente</Text>
            {reservation.customer ? (
              <>
                <View style={styles.row}><Text style={styles.label}>Nombre:</Text><Text style={styles.value}>{reservation.customer.first_name} {reservation.customer.last_name}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{reservation.customer.email || "-"}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Teléfono:</Text><Text style={styles.value}>{reservation.customer.phone || "-"}</Text></View>
              </>
            ) : <Text>Sin cliente asignado</Text>}
          </View>

          {/* VEHICULO */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>🚗 Vehículo Reservado</Text>
            {reservation.vehicle ? (
              <>
                <View style={styles.row}><Text style={styles.label}>Vehículo:</Text><Text style={styles.value}>{reservation.vehicle.brand} {reservation.vehicle.model}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Patente:</Text><Text style={styles.value}>{reservation.vehicle.plate}</Text></View>
              </>
            ) : <Text>Sin vehículo asignado</Text>}
          </View>
        </View>

        {/* TOMA DE USADO (Si existe) */}
        {reservation.usedVehicle && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionTitle}>🔄 Retoma (Vehículo entregado)</Text>
            <View style={{ flexDirection: "row" }}>
              <View style={styles.col}>
                <View style={styles.row}><Text style={styles.label}>Vehículo:</Text><Text style={styles.value}>{reservation.usedVehicle.brand} {reservation.usedVehicle.model}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Patente:</Text><Text style={styles.value}>{reservation.usedVehicle.plate}</Text></View>
              </View>
              <View style={styles.col}>
                <View style={styles.row}><Text style={styles.label}>Valor Toma:</Text><Text style={styles.value}>{formatCurrency(reservation.usedVehicle.price)}</Text></View>
              </View>
            </View>
          </View>
        )}

        {/* RESUMEN ECONÓMICO */}
        <View style={styles.totalsSection}>
          <Text style={styles.sectionTitle}>💰 Resumen</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Precio Venta:</Text>
            <Text style={styles.totalValue}>{formatCurrency(precioVenta)}</Text>
          </View>
          {valorUsado > 0 && (
             <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>(-) Retoma:</Text>
              <Text style={styles.totalValue}>{formatCurrency(valorUsado)}</Text>
            </View>
          )}
          {creditoBanco > 0 && (
             <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>(-) Crédito Banco:</Text>
              <Text style={styles.totalValue}>{formatCurrency(creditoBanco)}</Text>
            </View>
          )}
           <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>(-) Total Pagado:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalPagado)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.balance]}>Saldo:</Text>
            <Text style={[styles.totalValue, styles.balance]}>{formatCurrency(saldo)}</Text>
          </View>
        </View>

        {/* LISTADO DE PAGOS */}
        <Text style={styles.sectionTitle}>🧾 Historial de Pagos</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: "20%" }]}>Fecha</Text>
          <Text style={[styles.th, { width: "25%" }]}>Método</Text>
          <Text style={[styles.th, { width: "35%" }]}>Detalle / Ref</Text>
          <Text style={[styles.th, { width: "20%", textAlign: "right" }]}>Monto</Text>
        </View>
        
        {reservation.payments?.map((p: any) => (
          <View style={styles.tableRow} key={p.id}>
            <Text style={[styles.td, { width: "20%" }]}>{formatDate(p.created_at)}</Text>
            <Text style={[styles.td, { width: "25%" }]}>{p.method?.name || "Pago"}</Text>
            <Text style={[styles.td, { width: "35%" }]}>
              {p.details?.operation_number || p.details?.check_number || "-"}
            </Text>
            <Text style={[styles.td, { width: "20%", textAlign: "right" }]}>{formatCurrency(p.amount)}</Text>
          </View>
        ))}

        {/* COMENTARIOS */}
        {reservation.comments && (
          <View style={{ marginTop: 20, borderTop: "1px dashed #ccc", paddingTop: 10 }}>
            <Text style={{ fontWeight: "bold", fontSize: 10, marginBottom: 5 }}>Notas:</Text>
            <Text style={{ fontStyle: "italic", fontSize: 10 }}>{reservation.comments}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};