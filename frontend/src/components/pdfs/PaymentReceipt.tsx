import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Estilos
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "1px solid #000",
    paddingBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "bold", textTransform: "uppercase" },
  subtitle: { fontSize: 10, color: "gray" },
  section: {
    marginVertical: 10,
    padding: 10,
    border: "1px solid #eee",
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontWeight: "bold", width: "30%" },
  value: { width: "70%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 10,
    borderTop: "1px dashed #999",
  },
  totalLabel: { fontSize: 14, fontWeight: "bold" },
  totalValue: { fontSize: 14, fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "gray",
    fontSize: 10,
  },
});

// Props ahora incluye amount y concept explícitos
interface ReceiptProps {
  reservation: any;
  amount: number;
  concept: string; // Ej: "Seña", "Cuota 1", "Saldo Final"
}

export const PaymentReceipt = ({
  reservation,
  amount,
  concept,
}: ReceiptProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Recibo de Pago</Text>
          <Text style={styles.subtitle}>Comprobante de Ingreso</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text>Fecha: {new Date().toLocaleDateString()}</Text>
          <Text>Ref Reserva: #{reservation.id}</Text>
        </View>
      </View>

      {/* DATOS DEL CLIENTE Y VEHÍCULO */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Cliente:</Text>
          <Text style={styles.value}>
            {reservation.customer
              ? `${reservation.customer.first_name} ${reservation.customer.last_name}`
              : "Consumidor Final"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Vehículo:</Text>
          <Text style={styles.value}>
            {reservation.vehicle
              ? `${reservation.vehicle.brand} ${reservation.vehicle.model} - ${reservation.vehicle.plate}`
              : "No asignado"}
          </Text>
        </View>
      </View>

      {/* DETALLE DEL PAGO */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Concepto:</Text>
          <Text style={styles.value}>{concept}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Método de Pago:</Text>
          <Text style={styles.value}>
            {reservation.payment_method || "Efectivo / Transferencia"}
          </Text>
        </View>

        {/* TOTAL */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL RECIBIDO:</Text>
          <Text style={styles.totalValue}>
            ${amount.toLocaleString("es-AR")}
          </Text>
        </View>
      </View>

      {/* SALDOS (Informativo) */}
      <View style={{ marginTop: 10, paddingHorizontal: 10 }}>
        <Text style={{ fontSize: 10, color: "#555" }}>
          Restante por pagar (Saldo estimado): $
          {(reservation.balance || 0).toLocaleString("es-AR")}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>Documento no válido como factura fiscal.</Text>
        <Text>Antonini Automotores - Firma Autorizada</Text>
      </View>
    </Page>
  </Document>
);
