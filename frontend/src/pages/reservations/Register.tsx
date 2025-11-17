import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentMethodModal from "../../components/modals/PaymentMethodModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import api from "../../lib/api";

type Vehicle = {
  id: number;
  plate: string;
  brand: string;
  model: string;
  status: string;
  price?: number;
};

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  doc_number: string;
  email?: string;
  phone?: string;
};

type PaymentDetails = {
  bank_name?: string;
  check_number?: string;
  check_due_date?: string;
  account_alias?: string;
  account_holder?: string;
  card_last4?: string;
  card_holder?: string;
  installments?: number | "";
  operation_number?: string;
};

type Payment = {
  method_id: number | "";
  amount: number | "";
  details?: PaymentDetails;
};

type PaymentMethod = {
  id: number;
  name: string;
  type: string;
  requires_details?: boolean;
};

/* ========= COMPONENTE PRINCIPAL ========= */
export default function RegisterReservation() {
  const nav = useNavigate();
  const location = useLocation();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [usedVehicle, setUsedVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [searchPlate, setSearchPlate] = useState("");
  const [searchUsedPlate, setSearchUsedPlate] = useState("");
  const [searchDni, setSearchDni] = useState("");

  const [price, setPrice] = useState<number | "">("");
  const [comments, setComments] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<number>(0);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showModal, setShowModal] = useState(false);

  // toggles
  const [includeUsed, setIncludeUsed] = useState(false);
  const [includeDeposit, setIncludeDeposit] = useState(false);

  /* ====== Helpers búsqueda ====== */
  const searchVehicle = async () => {
    if (!searchPlate.trim()) return;
    try {
      const res = await api.get(`/vehicles?search=${searchPlate}`);
      const found = res.data?.data?.data?.[0] || res.data?.data?.[0];
      if (found) {
        setVehicle(found);
        setPrice(found.price || "");
        localStorage.setItem("reservation_vehicle", JSON.stringify(found));
        localStorage.setItem(
          "reservation_price",
          JSON.stringify(found.price || "")
        );
        setToast("Vehículo encontrado ✅");
      } else {
        setVehicle(null);
        localStorage.removeItem("reservation_vehicle");
        setToast("No se encontró vehículo con esa patente");
      }
    } catch {
      setToast("Error al buscar vehículo");
    }
  };

  const searchUsed = async () => {
    if (!searchUsedPlate.trim()) return;
    try {
      const res = await api.get(`/vehicles?search=${searchUsedPlate}`);
      const found = res.data?.data?.data?.[0] || res.data?.data?.[0];
      if (found) {
        setUsedVehicle(found);
        localStorage.setItem("reservation_used_vehicle", JSON.stringify(found));
        setToast("Vehículo usado encontrado ✅");
      } else {
        setUsedVehicle(null);
        localStorage.removeItem("reservation_used_vehicle");
        setToast("No se encontró vehículo usado");
      }
    } catch {
      setToast("Error al buscar vehículo usado");
    }
  };

  const searchCustomer = async () => {
    if (!searchDni.trim()) return;
    try {
      const res = await api.get(`/customers?dni=${searchDni}`);
      const found = res.data?.data?.[0];
      if (found) {
        setCustomer(found);
        setSearchDni(found.doc_number || "");
        localStorage.setItem("reservation_customer", JSON.stringify(found));
        setToast("Cliente encontrado ✅");
      } else {
        setCustomer(null);
        localStorage.removeItem("reservation_customer");
        setToast("No se encontró cliente con ese DNI");
      }
    } catch {
      setToast("Error al buscar cliente");
    }
  };

  /* ====== Carga inicial / redirect usado / métodos ====== */
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(location.search);
        const fromUsed = params.get("used");
        const vehicleId = params.get("vehicle_id");

        // 🔹 Si llega un vehículo desde el listado (reservar)
        if (vehicleId) {
          try {
            const res = await api.get(`/vehicles/${vehicleId}`);
            const v = res.data?.data || res.data;
            if (v) {
              setVehicle(v);
              setPrice(v.price || "");
              setSearchPlate(v.plate);
              localStorage.setItem("reservation_vehicle", JSON.stringify(v));
              localStorage.setItem(
                "reservation_price",
                JSON.stringify(v.price || "")
              );
              setToast("Vehículo cargado automáticamente ✅");
            }
          } catch {
            setToast("No se pudo cargar el vehículo seleccionado");
          }
        }

        const storedVehicle = localStorage.getItem("reservation_vehicle");
        const storedUsed = localStorage.getItem("reservation_used_vehicle");
        const storedCustomer = localStorage.getItem("reservation_customer");
        const storedPrice = localStorage.getItem("reservation_price");

        if (storedVehicle && !vehicleId) setVehicle(JSON.parse(storedVehicle));
        if (storedUsed) {
          setUsedVehicle(JSON.parse(storedUsed));
          setIncludeUsed(true);
        }
        if (storedCustomer) {
          const c = JSON.parse(storedCustomer);
          setCustomer(c);
          setSearchDni(c.doc_number || c.dni || "");
        }
        if (storedPrice && !vehicleId) setPrice(JSON.parse(storedPrice));

        // 🔹 Vehículo recién registrado
        const savedVehicle = localStorage.getItem("lastRegisteredVehicle");
        if (savedVehicle) {
          const v = JSON.parse(savedVehicle);
          localStorage.removeItem("lastRegisteredVehicle");
          let found: any = null;
          try {
            if (v.id) {
              const res = await api.get(`/vehicles/${v.id}`);
              found = res.data?.data || res.data;
            } else if (v.plate) {
              const res = await api.get(`/vehicles?search=${v.plate}`);
              found = res.data?.data?.data?.[0] || res.data?.data?.[0];
            }
          } catch {
            /* noop */
          }
          if (found) {
            if (fromUsed) {
              setIncludeUsed(true);
              setUsedVehicle(found);
              setSearchUsedPlate(found.plate);
              localStorage.setItem(
                "reservation_used_vehicle",
                JSON.stringify(found)
              );
              setToast("Vehículo usado cargado automáticamente ✅");
            } else {
              setVehicle(found);
              setSearchPlate(found.plate);
              setPrice(found.price || "");
              localStorage.setItem(
                "reservation_vehicle",
                JSON.stringify(found)
              );
              localStorage.setItem(
                "reservation_price",
                JSON.stringify(found.price || "")
              );
              setToast("Vehículo cargado automáticamente ✅");
            }
          }
        }

        // 🔹 Métodos de pago
        const methods = await api.get("/payment-methods");
        setPaymentMethods(methods.data?.data || methods.data || []);
      } catch {
        setToast("Error al cargar datos iniciales");
      }
    })();
  }, [location.search]);

  /* ====== Balance ====== */
  useEffect(() => {
    const total = Number(price) || 0;
    const pagos = includeDeposit
      ? payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
      : 0;
    const tradeIn = includeUsed && usedVehicle?.price ? usedVehicle.price : 0;
    setBalance(total - pagos - tradeIn);
  }, [price, payments, usedVehicle, includeUsed, includeDeposit]);

  /* ====== Gestión pagos ====== */
  const addPayment = () =>
    setPayments((p) => [...p, { method_id: "", amount: "" }]);

  const updatePayment = (index: number, key: keyof Payment, value: any) => {
    setPayments((prev) => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });
  };

  const updatePaymentDetail = (
    index: number,
    field: keyof PaymentDetails,
    value: any
  ) => {
    setPayments((prev) => {
      const copy = [...prev];
      const current = copy[index].details || {};
      copy[index].details = { ...current, [field]: value };
      return copy;
    });
  };

  const removePayment = (index: number) =>
    setPayments((prev) => prev.filter((_, i) => i !== index));

  useEffect(() => {
    if (!includeDeposit) setPayments([]);
    if (includeDeposit && payments.length === 0)
      setPayments([{ method_id: "", amount: "" }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeDeposit]);

  /* ====== Submit ====== */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!vehicle?.id) {
      setToast("Debe seleccionar un vehículo válido");
      setLoading(false);
      return;
    }
    if (!customer?.id) {
      setToast("Debe seleccionar un cliente válido");
      setLoading(false);
      return;
    }

    const validPayments = includeDeposit
      ? payments
          .filter((p) => p.method_id && Number(p.amount) > 0)
          .map((p) => {
            const details = p.details || {};
            const hasDetails = Object.values(details).some(
              (v) => v !== "" && v !== null && v !== undefined
            );

            return {
              method_id: Number(p.method_id),
              amount: Number(p.amount),
              ...(hasDetails ? { details } : {}),
            };
          })
      : [];

    if (includeDeposit && validPayments.length === 0) {
      setToast("Agregá al menos un medio de pago con monto válido");
      setLoading(false);
      return;
    }

    try {
      await api.post("/reservations", {
        vehicle_id: vehicle.id,
        used_vehicle_id: includeUsed ? usedVehicle?.id || null : null,
        customer_id: customer.id,
        seller_id: 1, // TODO: usuario logueado
        price,
        deposit: includeDeposit
          ? validPayments.reduce((a, p) => a + p.amount, 0)
          : null,
        payment_methods: validPayments,
        balance,
        comments,
      });

      setToast("Reserva creada correctamente ✅");
      [
        "reservation_vehicle",
        "reservation_used_vehicle",
        "reservation_customer",
        "reservation_price",
      ].forEach((k) => localStorage.removeItem(k));
      setTimeout(() => nav("/reservas"), 800);
    } catch (err: any) {
      setToast(
        err?.response?.data?.message || "No se pudo registrar la reserva"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ====== Cancelar ====== */
  const handleCancel = () => {
    setToast(
      "¿Cancelar la reserva y limpiar los datos? 🔄 Click nuevamente en 'Cancelar' para confirmar"
    );
    const confirmTimeout = setTimeout(() => setToast(""), 3000);

    const confirmHandler = () => {
      clearTimeout(confirmTimeout);
      [
        "reservation_vehicle",
        "reservation_used_vehicle",
        "reservation_customer",
        "reservation_price",
      ].forEach((k) => localStorage.removeItem(k));

      setVehicle(null);
      setUsedVehicle(null);
      setCustomer(null);
      setPrice("");
      setPayments([]);
      setComments("");
      setIncludeUsed(false);
      setIncludeDeposit(false);

      setToast("Reserva cancelada correctamente ✅");
      document.removeEventListener("click", confirmHandler);
      setTimeout(() => nav("/reservas"), 800);
    };

    document.addEventListener("click", confirmHandler, { once: true });
  };

  /* ========= RENDER ========= */
  return (
    <div className="container">
      <form onSubmit={onSubmit} className="vstack">
        <div className="title">Registrar reserva</div>

        {/* VEHÍCULO */}
        <div className="card vstack">
          <label>Vehículo principal *</label>
          <a
            href="/vehiculos/registro?redirect=/reservas/nueva"
            className="enlace"
          >
            + Registrar vehículo
          </a>
          <div className="hstack">
            <Input
              label="Buscar por patente"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.currentTarget.value)}
              placeholder="Ej: AB123CD"
            />
            <Button type="button" onClick={searchVehicle}>
              Buscar
            </Button>
          </div>
          {vehicle && (
            <div className="card">
              <p>
                <strong>
                  {vehicle.brand} {vehicle.model}
                </strong>{" "}
                — {vehicle.plate}
              </p>
              <p>Precio: ${vehicle.price?.toLocaleString() || "—"}</p>
            </div>
          )}
        </div>

        {/* CLIENTE */}
        <div className="card vstack">
          <label>Cliente *</label>
          <a
            href="/clientes/registro?redirect=/reservas/nueva"
            className="enlace"
          >
            + Registrar cliente
          </a>
          <div className="hstack">
            <Input
              label="Buscar por DNI"
              value={searchDni}
              onChange={(e) => setSearchDni(e.currentTarget.value)}
              placeholder="Ej: 30123456"
            />
            <Button type="button" onClick={searchCustomer}>
              Buscar
            </Button>
          </div>
          {customer && (
            <div className="card">
              <p>
                <strong>
                  {customer.first_name} {customer.last_name}
                </strong>
              </p>
              <p>DNI: {customer.doc_number}</p>
              {customer.email && <p>Email: {customer.email}</p>}
              {customer.phone && <p>Tel: {customer.phone}</p>}
            </div>
          )}
        </div>

        {/* VEHÍCULO USADO */}
        <label>
          <input
            type="checkbox"
            checked={includeUsed}
            onChange={() => setIncludeUsed(!includeUsed)}
          />{" "}
          Incluir vehículo usado como parte de pago
        </label>

        {includeUsed && (
          <div className="card vstack">
            <label>Vehículo usado (opcional)</label>
            <a
              href="/vehiculos/registro?redirect=/reservas/nueva?used=1"
              className="enlace"
            >
              + Registrar vehículo usado
            </a>
            <div className="hstack">
              <Input
                label="Buscar por patente"
                value={searchUsedPlate}
                onChange={(e) => setSearchUsedPlate(e.currentTarget.value)}
                placeholder="Ej: AC987EF"
              />
              <Button type="button" onClick={searchUsed}>
                Buscar
              </Button>
            </div>
            {usedVehicle && (
              <div className="card">
                <p>
                  <strong>
                    {usedVehicle.brand} {usedVehicle.model}
                  </strong>{" "}
                  — {usedVehicle.plate}
                </p>
                <p>
                  Valor tomado: ${usedVehicle.price?.toLocaleString() || "—"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SEÑA */}
        <label>
          <input
            type="checkbox"
            checked={includeDeposit}
            onChange={() => setIncludeDeposit(!includeDeposit)}
          />{" "}
          Registrar seña / anticipo
        </label>

        {includeDeposit && (
          <div className="card vstack">
            <label>Medios de pago</label>
            {payments.map((p, i) => {
              const selectedMethod = paymentMethods.find(
                (m) => m.id === Number(p.method_id)
              );

              return (
                <div key={i} className="vstack" style={{ gap: 8 }}>
                  <div className="hstack">
                    <select
                      value={p.method_id}
                      onChange={(e) =>
                        updatePayment(
                          i,
                          "method_id",
                          Number(e.currentTarget.value) || ""
                        )
                      }
                    >
                      <option value="">Seleccionar…</option>
                      {paymentMethods.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>

                    <Input
                      type="number"
                      label="Monto"
                      value={p.amount as any}
                      onChange={(e) =>
                        updatePayment(
                          i,
                          "amount",
                          e.currentTarget.value === ""
                            ? ""
                            : Number(e.currentTarget.value)
                        )
                      }
                    />

                    <Button type="button" onClick={() => removePayment(i)}>
                      🗑
                    </Button>
                  </div>

                  {/* Campos específicos según tipo de medio */}
                  {selectedMethod?.requires_details && (
                    <div className="card vstack">
                      {/* TRANSFERENCIA BANCARIA */}
                      {selectedMethod.type === "bank" && (
                        <>
                          <Input
                            label="Banco"
                            value={p.details?.bank_name || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "bank_name",
                                e.currentTarget.value
                              )
                            }
                          />
                          <Input
                            label="Alias / CBU"
                            value={p.details?.account_alias || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "account_alias",
                                e.currentTarget.value
                              )
                            }
                          />
                          <Input
                            label="Titular"
                            value={p.details?.account_holder || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "account_holder",
                                e.currentTarget.value
                              )
                            }
                          />
                          <Input
                            label="N° de operación"
                            value={p.details?.operation_number || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "operation_number",
                                e.currentTarget.value
                              )
                            }
                          />
                        </>
                      )}

                      {/* CHEQUE */}
                      {selectedMethod.type === "check" && (
                        <>
                          <Input
                            label="Banco"
                            value={p.details?.bank_name || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "bank_name",
                                e.currentTarget.value
                              )
                            }
                          />
                          <Input
                            label="N° de cheque"
                            value={p.details?.check_number || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "check_number",
                                e.currentTarget.value
                              )
                            }
                          />
                          <Input
                            type="date"
                            label="Fecha de vencimiento"
                            value={p.details?.check_due_date || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "check_due_date",
                                e.currentTarget.value
                              )
                            }
                          />
                          <Input
                            label="Titular"
                            value={p.details?.account_holder || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "account_holder",
                                e.currentTarget.value
                              )
                            }
                          />
                        </>
                      )}

                      {/* TARJETA */}
                      {selectedMethod.type === "card" && (
                        <>
                          <Input
                            label="Titular"
                            value={p.details?.card_holder || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "card_holder",
                                e.currentTarget.value
                              )
                            }
                          />
                          <Input
                            label="Últimos 4 dígitos"
                            value={p.details?.card_last4 || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "card_last4",
                                e.currentTarget.value
                              )
                            }
                          />
                          <Input
                            type="number"
                            label="Cuotas"
                            value={p.details?.installments ?? ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "installments",
                                e.currentTarget.value === ""
                                  ? ""
                                  : Number(e.currentTarget.value)
                              )
                            }
                          />
                        </>
                      )}

                      {/* CRÉDITO BANCARIO */}
                      {selectedMethod.type === "credit_bank" && (
                        <>
                          <Input
                            label="Banco"
                            value={p.details?.bank_name || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "bank_name",
                                e.currentTarget.value
                              )
                            }
                          />
                          <Input
                            label="N° de crédito / legajo"
                            value={p.details?.operation_number || ""}
                            onChange={(e) =>
                              updatePaymentDetail(
                                i,
                                "operation_number",
                                e.currentTarget.value
                              )
                            }
                          />
                        </>
                      )}

                      {/* Fallback genérico si requiere detalles pero no matchea tipo */}
                      {!["bank", "check", "card", "credit_bank"].includes(
                        selectedMethod.type
                      ) && (
                        <textarea
                          placeholder="Detalles del pago (CBU, referencia, etc.)"
                          value={p.details?.operation_number || ""}
                          onChange={(e) =>
                            updatePaymentDetail(
                              i,
                              "operation_number",
                              e.currentTarget.value
                            )
                          }
                          className="textarea"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="hstack">
              <a className="enlace" onClick={addPayment}>
                + Agregar medio
              </a>
              <a className="enlace" onClick={() => setShowModal(true)}>
                + Nuevo método
              </a>
            </div>
          </div>
        )}

        {/* SALDO */}
        <div className="card vstack">
          <label>Saldo restante ($)</label>
          <input
            type="number"
            value={balance}
            readOnly
            className="input-readonly"
          />
        </div>

        {/* COMENTARIOS */}
        <div className="card vstack">
          <label>Comentarios</label>
          <textarea
            placeholder="Observaciones adicionales, condiciones de pago, etc."
            value={comments}
            onChange={(e) => setComments(e.currentTarget.value)}
            className="textarea"
          />
        </div>

        {/* ACCIONES */}
        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={loading}>
            Guardar
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
          >
            Cancelar
          </Button>
        </div>
      </form>

      {showModal && (
        <PaymentMethodModal
          onClose={() => setShowModal(false)}
          onCreated={(m) => {
            setPaymentMethods((prev) => [...prev, m]);
            setToast("Método agregado correctamente ✅");
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") ? "success" : "error"}
        />
      )}
    </div>
  );
}
