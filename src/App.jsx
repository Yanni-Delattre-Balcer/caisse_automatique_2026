import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import * as XLSX from "xlsx-js-style";
import { Peer } from "peerjs";
import { QRCodeCanvas } from "qrcode.react";


// --- AUTO-PURGE FIRST LOAD ---
if (!localStorage.getItem('virgin_reset_done_2026_1')) {
  localStorage.clear();
  localStorage.setItem('virgin_reset_done_2026_1', 'true');
  console.log("CACHE NAVIGATEUR PURGE AVEC SUCCES");
  window.location.reload();
}

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#e74c3c", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h2> ⚠️ Oups ! Quelque chose s'est mal passé.</h2>
          <p>L'application a rencontré une erreur inattendue.</p>
          <div style={{ background: "#fdf0ef", padding: "15px", borderRadius: "10px", margin: "10px 0", maxWidth: "80%", wordBreak: "break-all" }}>
            <code style={{ fontSize: "14px", color: "#c0392b" }}>
              {this.state.error && this.state.error.toString()}
            </code>
          </div>
          <p style={{ fontSize: "12px", color: "#666" }}>Cela peut arriver si les données importées sont malformées.</p>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "12px 24px", background: "#3498db", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}
            >
              🔄 Actualiser
            </button>
            <button
              onClick={() => { if (window.confirm("Voulez-vous vraiment réinitialiser les données locales ?")) { localStorage.clear(); window.location.reload(); } }}
              style={{ padding: "12px 24px", background: "#e74c3c", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}
            >
              🗑️ Réinitialiser Local
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// --- HELPERS PERSISTENCE DRIVE (IndexedDB) ---
// La File System Access API demande IndexedDB pour stocker les handles de fichiers de manière persistante.
const IDB_NAME = "CaisseHairaudeDB";
const LEGACY_IDB_NAME = "HairAudeDriveDB";
const STORE_NAME = "handles";
const getIDB = (name = IDB_NAME) =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
const saveHandleToIDB = async (handle, key = "drive_handle") => {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(handle, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`❌Erreur save IDB (${key}):`, e);
  }
};
const loadHandleFromIDB = async (key = "drive_handle") => {
  try {
    // 1. Tenter de charger depuis la DB actuelle
    let handle = await _loadFromDB(IDB_NAME, key);
    if (handle) return handle;
    // 2. Tenter migration depuis legacy (seulement pour drive_handle)
    if (key === "drive_handle") {
      console.log(" 📦  Recherche d'un ancien lien Drive...");
      handle = await _loadFromDB(LEGACY_IDB_NAME, key);
      if (handle) {
        console.log(" ⚠️ Migration du lien Drive vers la nouvelle DB...");
        await saveHandleToIDB(handle, key);
        return handle;
      }
    }
  } catch (e) {
    console.warn(`IDB Load exploration failed (${key}):`, e);
  }
  return null;
};
const _loadFromDB = (name, key) =>
  new Promise((resolve) => {
    const request = indexedDB.open(name, 1);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        return resolve(null);
      }
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        db.close();
        resolve(getReq.result);
      };
      getReq.onerror = () => {
        db.close();
        resolve(null);
      };
    };
    request.onerror = () => resolve(null);
    request.onupgradeneeded = () => resolve(null); // Ne pas créer si n'existe pas lors de la recherche
  });
const DEFAULT_CATALOG = {};
// --- BASE DE DONNÉES TECHNIQUE À IMPORTER ---
const NEW_TECHNICAL_PRODUCTS = {};
const NEW_CATALOG_ITEMS_2026_02 = {};
const WeeklyChart = ({ data }) => {
  const hasData = data.some((w) => w.total > 0);
  const max = Math.max(...data.map((w) => w.total), 100);
  return (
    <div style={{ marginTop: "20px", position: "relative" }}>
      {!hasData && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#999",
            fontSize: "14px",
            zIndex: 1,
          }}
        >
          Aucune donnée pour ce mois
        </div>
      )}
      <div
        className="chart-wrapper"
        style={{
          height: "360px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "15px",
          padding: "35px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #eee",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)",
          opacity: hasData ? 1 : 0.5,
        }}
      >
        {data.map((w, i) => {
          const heightPercent = (w.total / max) * 100;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "60px",
                  height: `${heightPercent}%`,
                  background: "linear-gradient(to top, #9b59b6, #00bfff)",
                  borderRadius: "8px 8px 4px 4px",
                  transition: "height 0.5s ease-out",
                  position: "relative",
                  boxShadow: "0 4px 15px rgba(155, 89, 182, 0.2)",
                }}
              >
                {w.total > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-25px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: "#9b59b6",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {Math.round(w.total)} €                  </div>
                )}
              </div>
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "#7f8c8d",
                  fontWeight: "bold",
                }}
              >
                S{i + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
// --- HELPERS FILTRES DYNAMIQUES ---
const getDerivedFilters = (catalog, type) => {
  const filters = new Set();
  if (!catalog || typeof catalog !== "object") return [];
  Object.values(catalog).forEach((item) => {
    if (type === "VENTE" && (item.type === "retail" || item.type === "both")) {
      // Si le filtre est "PRODUIT" mais qu'une gamme est définie, on utilise la Gamme comme filtre
      if (item.filtre === "PRODUIT" && item.gamme) {
        filters.add(item.gamme);
      } else {
        filters.add(item.filtre);
      }
    } else if (type === "TECHNIQUE" && (item.type === "technical" || item.type === "both")) {
      // --- UPDATE: Pour les produits techniques, on veut aussi voir les Gammes si elles existent ---
      if (item.gamme) {
        filters.add(item.gamme);
      } else {
        filters.add(item.filtre);
      }
    } else if (
      type === "COIFFURE" &&
      !item.type &&
      item.filtre &&
      [
        "HOMME",
        "JUNIOR",
        "DAME COURTS",
        "DAME LONGS",
        "TECHNIQUE COURTS",
        "TECHNIQUE LONGS",
        "TECHNIQUE SEULE",
        "SOINS",
        "TECHNIQUE HOMME",
      ].includes(item.filtre)
    ) {
      filters.add(item.filtre);
    } else if (
      type === "ESTHETIQUE" &&
      !item.type &&
      item.filtre &&
      ![
        "HOMME",
        "JUNIOR",
        "DAME COURTS",
        "DAME LONGS",
        "TECHNIQUE COURTS",
        "TECHNIQUE LONGS",
        "TECHNIQUE SEULE",
        "SOINS",
        "TECHNIQUE HOMME",
      ].includes(item.filtre)
    ) {
      filters.add(item.filtre);
    }
  });
  // Fallbacks si vides pour ne pas avoir une UI cassée au début
  if (filters.size === 0) {
    if (type === "COIFFURE")
      return ["HOMME", "DAME COURTS", "DAME LONGS", "JUNIOR", "SOINS"];
    if (type === "ESTHETIQUE")
      return ["ONGLERIE", "EPILATION", "SOINS VISAGE", "REGARDS"];
    // REMOVED FORCED DEFAULTS FOR VENTE AND TECHNIQUE
    // We want "Aucun élément trouvé" if empty
  }
  return Array.from(filters).sort();
};
const RemoteScanner = ({ peerId }) => {
  const [status, setStatus] = useState("Initialisation...");
  const [error, setError] = useState(null);
  const [lastScanned, setLastScanned] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const scannerRef = useRef(null);
  const connRef = useRef(null);
  const stockTimeoutRef = useRef(null);
  useEffect(() => {
    let peer = null;
    let timeoutId = null;
    const init = async () => {
      try {
        setStatus("Recherche du PC...");
        // Configuration Robuste avec STUN Google
        peer = new Peer({
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        });
        // Timeout de 15 secondes pour la connexion
        timeoutId = setTimeout(() => {
          if (status !== " ✅ Caméra active ! Prêt à scanner.") {
            setError(
              "Délai d'attente dépassé (Time Out). Assurez-vous que le PC est sur le même Wi-Fi et que la page STOCKS est ouverte.",
            );
          }
        }, 15000);
        peer.on("open", (id) => {
          setStatus("Connexion au PC...");
          const attemptConnection = () => {
            if (!peer || peer.destroyed) return;
            const conn = peer.connect(peerId, {
              reliable: false,
            });
            conn.on("open", () => {
              clearTimeout(timeoutId);
              setStatus(" ✅ Connecté ! Initialisation caméra...");
              connRef.current = conn;
              conn.on("data", (incoming) => {
                if (incoming && incoming.type === "STOCK_INFO") {
                  setStockInfo(incoming.data);
                  if (stockTimeoutRef.current) clearTimeout(stockTimeoutRef.current);
                  stockTimeoutRef.current = setTimeout(() => {
                    setStockInfo(null);
                  }, 15000);
                }
              });
              setTimeout(() => {
                if (typeof window.Html5Qrcode === "undefined") {
                  setError("La bibliothèque de scan n'est pas chargée.");
                  return;
                }
                startScanner();
              }, 500);
            });
            conn.on("close", () => {
              setStatus("❌ Déconnecté du PC. Reconnexion...");
              connRef.current = null;
              setTimeout(attemptConnection, 3000);
            });
            conn.on("error", (err) => {
              console.error("Conn error:", err);
              // Si erreur de connexion, on réessaie aussi
              setTimeout(attemptConnection, 5000);
            });
          };
          attemptConnection();
        });
        peer.on("error", (err) => {
          console.error("Peer error:", err);
          if (err.type === "network" || err.type === "unavailable-id") {
            setStatus("Recherche du réseau...");
            setTimeout(init, 5000);
          } else {
            setError("Erreur réseau (PeerJS) : " + err.type);
          }
        });
      } catch (e) {
        setError("Erreur fatale : " + e.message);
      }
    };
    init();
    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) scannerRef.current.stop().catch(() => { });
      if (peer) peer.destroy();
    };
  }, [peerId]);
  function startScanner() {
    try {
      const html5QrCode = new window.Html5Qrcode("remote-reader");
      scannerRef.current = html5QrCode;
      html5QrCode
        .start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (connRef.current) {
              // Logique de stabilité : il faut tenir le même code 2 secondes
              if (decodedText === window._pendingCode) {
                if (Date.now() - window._pendingStartTime > 2000) {
                  connRef.current.send(decodedText);
                  setLastScanned(decodedText);
                  if (navigator.vibrate) navigator.vibrate(100);
                  document.body.style.background = "#2ecc71";
                  // Reset pour le prochain scan
                  window._pendingCode = null;
                  window._pendingStartTime = 0;
                  setTimeout(() => {
                    document.body.style.background = "#1a1a1a";
                    setLastScanned(null);
                  }, 500);
                } else {
                  // En attente... Feedback visuel
                  setStatus(
                    `⏳ Analyse... (${Math.ceil((2000 - (Date.now() - window._pendingStartTime)) / 1000)}s)`,
                  );
                }
              } else {
                window._pendingCode = decodedText;
                window._pendingStartTime = Date.now();
                setStatus("⏳ Stabilisation...");
              }
            } else {
              setError("Lien perdu avec le PC. Essayez de rafraîchir.");
            }
          },
        )
        .then(() => setStatus(" ✅ Caméra active ! Prêt à scanner."))
        .catch((err) => setError("Caméra bloquée ou non trouvée."));
    } catch (e) {
      setError("Erreur scanner: " + e.message);
    }
  };
  if (error) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          background: "#1a1a1a",
          color: "white",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          overflowY: "auto",
        }}
      >
        <h2 style={{ color: "#ff4d4d" }}>❌Connexion impossible</h2>
        <p style={{ margin: "20px 0", fontSize: "14px", lineHeight: "1.5" }}>
          {error}
        </p>
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            padding: "15px",
            borderRadius: "15px",
            fontSize: "12px",
            textAlign: "left",
            color: "#bbb",
          }}
        >
          <strong>Conseils :</strong>
          <br />
          1. Vérifiez que votre téléphone est sur le <strong>
            même Wi-Fi
          </strong>{" "}
          que le PC.
          <br />
          2. Gardez la page <strong>STOCKS</strong> ouverte sur le PC.
          <br />
          3. Rafraîchissez la page du PC et scannez à nouveau le QR code.
        </div>
        <button
          style={{
            padding: "12px 25px",
            borderRadius: "50px",
            background: "#00bfff",
            color: "white",
            border: "none",
            marginTop: "30px",
            fontWeight: "bold",
          }}
          onClick={() => window.location.reload()}
        >
          REESSAYER
        </button>
      </div>
    );
  }
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#1a1a1a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        zIndex: 10000,
        overflowY: "auto",
        padding: "20px 0",
      }}
    >
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2 style={{ color: "#00bfff", margin: "0 0 10px 0" }}>
          📦  Scanner HairAude
        </h2>
        <div
          style={{
            padding: "8px 15px",
            borderRadius: "20px",
            background: status.includes("✅")
              ? "rgba(46, 204, 113, 0.2)"
              : "rgba(231, 76, 60, 0.2)",
            color: status.includes("✅") ? "#2ecc71" : "#e74c3c",
            fontSize: "14px",
            fontWeight: "bold",
            display: "inline-block",
          }}
        >
          {status}
        </div>
      </div>
      <div
        id="remote-reader"
        style={{
          width: "90%",
          maxWidth: "400px",
          borderRadius: "15px",
          overflow: "hidden",
          border: "2px solid #333",
          background: "#000",
          position: "relative",
        }}
      >
        {lastScanned && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(46, 204, 113, 0.9)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: "bold",
              zIndex: 10,
            }}
          >
            ENVOYÉ !
          </div>
        )}
      </div>
      {stockInfo && (
        <div
          style={{
            marginTop: "20px",
            width: "90%",
            maxWidth: "400px",
            background: "rgba(255,255,255,0.1)",
            padding: "20px",
            borderRadius: "20px",
            border: "2px solid #00bfff",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div style={{ color: "#00bfff", fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
            📦  {stockInfo.nom}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase" }}>Stock</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: stockInfo.quantite <= stockInfo.seuilAlerte ? "#ff4d4d" : "#2ecc71" }}>
                {stockInfo.quantite}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase" }}>Prix</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f1c40f" }}>
                {(Number(stockInfo.prixVente) || 0).toFixed(2)}€              </div>
            </div>
          </div>
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#bbb" }}>
            Seuil d'alerte : <span style={{ color: "#fff" }}>{stockInfo.seuilAlerte}</span>
          </div>
        </div>
      )}
      <button
        style={{
          marginTop: "30px",
          padding: "12px 25px",
          borderRadius: "50px",
          border: "none",
          background: "#333",
          color: "white",
          fontWeight: "bold",
        }}
        onClick={() => (window.location.href = window.location.origin)}
      >
        Quitter
      </button>
    </div>
  );
};
const DataAnalytics = ({ history, archives, selectedDay, selectedMonth, catalog, missions, isMobile, handleDeleteTransaction, handleEditTransaction, activeArchiveMonth }) => {
  // Helper to merge all history for yearly analysis
  const fullHistory = React.useMemo(() => {
    const safeHistoryLocal = Array.isArray(history) ? history : [];
    const safeArchives = (archives && typeof archives === 'object' && !Array.isArray(archives)) ? archives : {};
    let allRaw = [...safeHistoryLocal];
    Object.values(safeArchives).forEach(monthData => {
      if (Array.isArray(monthData)) allRaw = [...allRaw, ...monthData];
    });

    // Déduplication par ID pour éviter les doublons (quand history == archive du mois)
    const unique = [];
    const seen = new Set();
    allRaw.forEach(t => {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    });
    return unique;
  }, [history, archives]);

  // GLOBAL SAFETY GUARD for residual references
  const safeHistory = fullHistory;

  // Helper to normalize date to YYYY-MM-DD for ISO startsWith filtering
  const normalizeDate = (d) => {
    if (!d || typeof d !== "string") return "";
    // Robust parsing for common formats: DD/MM/YYYY or DD-MM-YYYY
    const slashParts = d.split("/");
    if (slashParts.length === 3) {
      const [dd, mm, yyyy] = slashParts;
      if (yyyy.length === 4) return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    const dashParts = d.split("-");
    if (dashParts.length === 3) {
      if (dashParts[0].length === 4) return d;
      const [dd, mm, yyyy] = dashParts;
      if (yyyy.length === 4) return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return d;
  };

  // Specific histories for different periods
  const currentMonthHistory = React.useMemo(() => {
    return fullHistory.filter(h => {
      const norm = normalizeDate(h.Date);
      return norm && norm.startsWith(selectedMonth);
    });
  }, [fullHistory, selectedMonth]);

  const currentDayHistory = React.useMemo(() => {
    return fullHistory.filter(h => normalizeDate(h.Date) === selectedDay);
  }, [fullHistory, selectedDay]);

  const currentYearHistory = React.useMemo(() => {
    const year = selectedMonth.split("-")[0];
    return fullHistory.filter(h => {
      const norm = normalizeDate(h.Date);
      return norm && norm.startsWith(year);
    });
  }, [fullHistory, selectedMonth]);

  // Premium Color Palette
  const PREMIUM_COLORS = [
    "#00bfff", // Blue
    "#ff1493", // Pink
    "#2ecc71", // Green
    "#9b59b6", // Purple
    "#f1c40f", // Yellow
    "#e67e22", // Orange
    "#1abc9c", // Teal
    "#34495e", // Navy
    "#e74c3c", // Red
    "#8e44ad", // Violet
  ];
  const STAFF_COLORS_FIXED = {
    "Florence": "#00bfff",
    "Magalie": "#ff1493",
    "Aude": "#2ecc71",
    "Manon": "#9b59b6"
  };

  const dynamicStaff = React.useMemo(() => {
    const members = new Set();
    // Base staff to ensure they always appear
    ["Florence", "Magalie", "Aude", "Manon"].forEach(s => members.add(s));

    fullHistory.forEach(h => {
      if (Array.isArray(h.caissieres)) {
        h.caissieres.forEach(c => members.add(String(c).trim()));
      } else if (h.caissiere) {
        h.caissiere.split(" & ").forEach(c => members.add(String(c).trim()));
      }
      if (Array.isArray(h.items_staff)) {
        h.items_staff.forEach(s => { if (s) members.add(String(s).trim()); });
      }
    });
    // Add missions staff too
    if (Array.isArray(missions)) {
      missions.forEach(m => { if (m.faitPar) members.add(String(m.faitPar).trim()); });
    }
    return Array.from(members).filter(m => m && m !== "null" && m !== "undefined" && m !== "?");
  }, [fullHistory, missions]);

  const getStaffColor = (name) => {
    if (STAFF_COLORS_FIXED[name]) return STAFF_COLORS_FIXED[name];
    const idx = dynamicStaff.indexOf(name);
    return PREMIUM_COLORS[idx % PREMIUM_COLORS.length];
  };
  // 1. Revenue Evolution (Line Chart) -> YEARLY
  const revenueData = React.useMemo(() => {
    const grouped = {};
    currentYearHistory.forEach((h) => {
      if (h && h.Date) {
        if (!grouped[h.Date]) grouped[h.Date] = 0;
        grouped[h.Date] += Number(h.Total) || 0;
      }
    });
    return Object.keys(grouped)
      .sort((a, b) => {
        const da = normalizeDate(a);
        const db = normalizeDate(b);
        return da.localeCompare(db);
      })
      .map((date) => ({
        date: date,
        revenu: Math.round(grouped[date] * 100) / 100,
      }));
  }, [currentYearHistory]);
  // Helper for matching old history names (e.g. "brosse") to new catalog names (e.g. "🛒 Brosse")
  const getNormalizedProductName = React.useCallback((historyName, catalogMap) => {
    if (!historyName) return null;
    let cleanName = historyName;
    if (String(cleanName).startsWith("DIVERS - ")) {
      const parts = String(cleanName).split(" - ");
      if (parts.length >= 2) {
        cleanName = "DIVERS - " + parts[1].trim();
      }
    }

    if (catalogMap[cleanName]) return cleanName; // Direct match

    const cleanHistory = String(cleanName).replace(/^[🛒🎨🛍️✂️💆‍♀️📦\s]+/, "").trim().toLowerCase();
    for (const catName of Object.keys(catalogMap)) {
      const cleanCat = String(catName).replace(/^[🛒🎨🛍️✂️💆‍♀️📦\s]+/, "").trim().toLowerCase();
      if (cleanCat === cleanHistory) {
        return catName;
      }
    }
    return String(cleanName).replace(/^[🛒🎨🛍️✂️💆‍♀️📦\s]+/, "").trim(); // Fallback to original if not found
  }, []);

  // 2. Top Products (Bar Chart) -> YEARLY
  const topProductsData = React.useMemo(() => {
    const counts = {};
    const safeCatalog = (catalog && typeof catalog === 'object') ? catalog : {};

    currentYearHistory.forEach((h) => {
      let items = [];
      if (h && Array.isArray(h.items_names) && h.items_names.length > 0) items = h.items_names;
      else if (h && h.Détails) items = h.Détails.split(",").map(s => s.trim());

      if (items.length > 0) {
        items.forEach((rawName) => {
          const name = getNormalizedProductName(rawName, safeCatalog);
          const item = safeCatalog[name];
          const isDivers = name.startsWith("DIVERS - ");
          const isGiftCard = name.startsWith("CARTE CADEAU - ");

          let isRetail = false;
          if (item) {
            isRetail = item.type === "retail" || item.type === "both";
            if (!item.type) {
              const f = String(item.filtre || "").toUpperCase();
              isRetail = ["VENTE", "DIVERS", "MATERIEL", "ACCESSOIRES"].includes(f) || f.includes("VENTE") || f.includes("REVENTE");
            }
          }

          if (isRetail || (isDivers && !isGiftCard)) {
            counts[name] = (counts[name] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], idx) => ({
        name: String(name).replace(/[\u{1F300}-\u{1F9FF}]/gu, "").replace(/^[🛒🎨🛍️✂️💆‍♀️📦\s]+/, "").trim(),
        value,
        color: PREMIUM_COLORS[idx % PREMIUM_COLORS.length]
      }));
  }, [currentYearHistory, catalog, getNormalizedProductName]);
  // 3. Top Services (Pie Chart) -> YEARLY
  const topServicesData = React.useMemo(() => {
    const counts = {};
    const displayNames = {}; // Pour garder le nom d'affichage propre
    const safeCatalog = (catalog && typeof catalog === 'object') ? catalog : {};

    currentYearHistory.forEach((h) => {
      let items = [];
      if (h && Array.isArray(h.items_names) && h.items_names.length > 0) items = h.items_names;
      else if (h && h.Détails) items = h.Détails.split(",").map(s => s.trim());

      if (items.length > 0) {
        items.forEach((rawName) => {
          const name = getNormalizedProductName(rawName, safeCatalog);
          const item = safeCatalog[name];
          const cleanName = String(name).replace(/^[🛒🎨🛍️✂️💆‍♀️📦\s]+/, "").trim();
          const isDivers = cleanName.toUpperCase().startsWith("DIVERS");
          const isGiftCard = cleanName.toUpperCase().startsWith("CARTE CADEAU");

          let isTech = false;
          if (item) {
            isTech = item.type === "technical" || item.type === "both";
            if (!item.type) {
              const f = String(item.filtre || "").toUpperCase();
              const isRetailFiltre = ["VENTE", "DIVERS", "MATERIEL", "ACCESSOIRES"].includes(f) || f.includes("VENTE") || f.includes("REVENTE");
              isTech = !isRetailFiltre;
            }
          } else {
            isTech = true;
          }

          if (isTech && !isGiftCard && !isDivers) {
            // Clé normalisée : sans émojis, lowercase, trim pour regrouper toutes les variantes
            const cleanKey = cleanName.toLowerCase();
            if (!displayNames[cleanKey]) displayNames[cleanKey] = cleanName; // Garder le premier nom propre pour l'affichage
            counts[cleanKey] = (counts[cleanKey] || 0) + 1;
          }
        });
      }
    });

    console.log("🔍 DEBUG Top 5 Prestations - Comptage complet :", counts);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, value], idx) => ({
        name: (displayNames[key] || key).replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim(),
        value,
        color: PREMIUM_COLORS[idx % PREMIUM_COLORS.length]
      }));
  }, [currentYearHistory, catalog, getNormalizedProductName]);
  // 4. Team Performance (Volume of services / Points) -> MONTHLY
  const teamPerformance = React.useMemo(() => {
    const daily = {};
    currentMonthHistory.forEach(h => {
      if (h && h.Date) {
        if (!daily[h.Date]) daily[h.Date] = {};

        const staffGlobal = Array.isArray(h.caissieres) ? h.caissieres : (h.caissiere ? h.caissiere.split(" & ") : []);

        let items = [];
        if (Array.isArray(h.items_names) && h.items_names.length > 0) items = h.items_names;
        else if (h.Détails) items = h.Détails.split(",").map(s => s.trim());

        const staffPerItem = Array.isArray(h.items_staff) ? h.items_staff : [];
        if (items.length > 0) {
          items.forEach((_, i) => {
            const staffOne = staffPerItem[i];
            if (staffOne) {
              // Precise attribution
              const name = String(staffOne).trim();
              daily[h.Date][name] = (daily[h.Date][name] || 0) + 1;
            } else if (staffGlobal.length > 0) {
              // Shared attribution (fallback)
              const splitPoint = 1 / staffGlobal.length;
              staffGlobal.forEach(name => {
                const cleanName = String(name).trim();
                daily[h.Date][cleanName] = (daily[h.Date][cleanName] || 0) + splitPoint;
              });
            }
          });
        }
      }
    });
    return Object.keys(daily)
      .sort((a, b) => {
        const da = normalizeDate(a);
        const db = normalizeDate(b);
        return da.localeCompare(db);
      })
      .map(date => {
        const entry = { date };
        Object.keys(daily[date]).forEach(name => {
          entry[name] = Math.round(daily[date][name]);
        });
        return entry;
      });
  }, [currentMonthHistory, dynamicStaff]);
  // 5. Missions Performance -> MONTHLY
  const missionsPerformance = React.useMemo(() => {
    const monthlyStats = {};
    const currentMonthPrefix = selectedMonth;
    (missions || []).filter(m => m.statut === "ARCHIVE" && m.date && m.date.startsWith(currentMonthPrefix)).forEach(m => {
      // Regroupement par mois au lieu de par date
      const monthKey = m.date.slice(0, 7);
      if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { date: monthKey };

      const actualStaff = m.faitPar || "";
      if (actualStaff) {
        monthlyStats[monthKey][actualStaff] = (monthlyStats[monthKey][actualStaff] || 0) + 1;
      }
    });
    return Object.values(monthlyStats);
  }, [missions, selectedMonth]);
  // 6. Global Distribution (Pie Chart) -> MONTHLY
  const globalDistribution = React.useMemo(() => {
    let prestations = 0;
    let ventes = 0;
    const safeCatalog = (catalog && typeof catalog === 'object') ? catalog : {};

    currentMonthHistory.forEach((h) => {
      let items = [];
      if (h && Array.isArray(h.items_names) && h.items_names.length > 0) items = h.items_names;
      else if (h && h.Détails) items = h.Détails.split(",").map(s => s.trim());

      if (items.length > 0) {
        items.forEach((rawName, idx) => {
          const name = getNormalizedProductName(rawName, safeCatalog);
          const item = safeCatalog[name];

          let price = h.items_prices && h.items_prices[idx] !== undefined ? Number(h.items_prices[idx]) : 0;
          if (price === 0 && h.Détails) {
            // Backup pour anciens historiques (ex: "Shampooing - 15 - Florence")
            const parts = String(rawName).split(" - ");
            if (parts.length >= 2 && !isNaN(parseFloat(parts[1]))) {
              price = parseFloat(parts[1]);
            } else if (items.length > 0 && h.Total) {
              // Fallback final: diviser le total
              price = Number(h.Total) / items.length;
            }
          }

          const isDivers = name.startsWith("DIVERS - ");
          const isGiftCard = name.startsWith("CARTE CADEAU - ");

          let isRetail = false;
          if (item) {
            isRetail = item.type === "retail" || item.type === "both";
            if (!item.type) {
              const f = String(item.filtre || "").toUpperCase();
              isRetail = ["VENTE", "DIVERS", "MATERIEL", "ACCESSOIRES"].includes(f) || f.includes("VENTE") || f.includes("REVENTE");
            }
          }

          if (isRetail || (isDivers && !isGiftCard)) {
            ventes += price || 0;
          } else {
            prestations += price || 0;
          }
        });
      } else if (h.Total) {
        prestations += Number(h.Total) || 0;
      }
    });
    return [
      { name: "Prestations & Technique", value: Math.round(prestations), color: "#9b59b6" },
      { name: "Ventes Produits / Divers", value: Math.round(ventes), color: "#2ecc71" }
    ].filter(d => d.value > 0);
  }, [currentMonthHistory, catalog]);

  // 7. Part de CA par Collaborateur (Pie Chart) -> YEARLY
  const caPerCollaborator = React.useMemo(() => {
    const daily = {};
    // Pre-fill with all dynamic staff so they appear in legend even if 0
    if (Array.isArray(dynamicStaff)) {
      dynamicStaff.forEach(name => {
        daily[name] = 0;
      });
    }

    currentYearHistory.forEach((h) => {
      const staffGlobal = Array.isArray(h.caissieres) ? h.caissieres : (h.caissiere ? h.caissiere.split(" & ") : []);
      const items = Array.isArray(h.items_names) ? h.items_names : [];
      const prices = Array.isArray(h.items_prices) ? h.items_prices : [];
      const staffPerItem = Array.isArray(h.items_staff) ? h.items_staff : [];

      if (items.length > 0 && prices.length > 0) {
        items.forEach((_, i) => {
          const staffOne = staffPerItem[i];
          const price = Number(prices[i]) || 0;
          if (staffOne) {
            const name = String(staffOne).trim();
            daily[name] = (daily[name] || 0) + price;
          } else if (staffGlobal.length > 0) {
            const splitPrice = price / staffGlobal.length;
            staffGlobal.forEach(name => {
              const cleanName = String(name).trim();
              daily[cleanName] = (daily[cleanName] || 0) + splitPrice;
            });
          }
        });
      } else if (staffGlobal.length > 0) {
        // Fallback for old history without detailed items
        const total = Number(h.Total) || 0;
        const splitPrice = total / staffGlobal.length;
        staffGlobal.forEach(name => {
          const cleanName = String(name).trim();
          daily[cleanName] = (daily[cleanName] || 0) + splitPrice;
        });
      }
    });

    return Object.keys(daily).map(name => ({
      name,
      value: Math.round(daily[name]),
      color: getStaffColor(name)
    })); // Ne pas filtrer les >0 pour afficher "Manon (0%)" dans la légende si besoin
  }, [currentYearHistory, dynamicStaff]);

  // 8. Top 10 Clients VIP -> YEARLY (Replacing payment methods)
  const top10ClientsData = React.useMemo(() => {
    const map = {};
    currentYearHistory.forEach((h) => {
      const name = h.Nom_Client || h.ClientNom || h.client || "Client Inconnu";
      if (name === "Client Inconnu" || name === "?" || name === "Passant") return;
      map[name] = (map[name] || 0) + (Number(h.Total) || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, total], idx) => ({
        name,
        total: Math.round(total),
        color: PREMIUM_COLORS[idx % PREMIUM_COLORS.length]
      }));
  }, [currentYearHistory]);

  // 9. Affluence par Heure (Area Chart) -> DAILY
  const hourlyTraffic = React.useMemo(() => {
    const hours = {};
    for (let i = 8; i <= 20; i++) hours[`${i}h`] = 0; // Initialize standard hours

    currentDayHistory.forEach(h => {
      if (h && h.Heure && typeof h.Heure === "string") {
        const hour = parseInt(h.Heure.split(":")[0]);
        if (!isNaN(hour) && hour >= 8 && hour <= 20) {
          hours[`${hour}h`] += 1;
        }
      }
    });
    return Object.keys(hours).map(h => ({
      heure: h,
      tickets: hours[h]
    }));
  }, [currentDayHistory]);

  // 10. Evolution Panier Moyen (Area Chart) -> MONTHLY
  const averageCartBasket = React.useMemo(() => {
    const daily = {};
    currentMonthHistory.forEach(h => {
      if (h && h.Date) {
        if (!daily[h.Date]) daily[h.Date] = { total: 0, count: 0 };
        daily[h.Date].total += Number(h.Total) || 0;
        daily[h.Date].count += 1;
      }
    });
    return Object.keys(daily)
      .sort((a, b) => {
        const da = normalizeDate(a);
        const db = normalizeDate(b);
        return da.localeCompare(db);
      })
      .map(date => ({
        date,
        panier: Math.round((daily[date].total / daily[date].count) * 10) / 10
      }));
  }, [currentMonthHistory]);

  // 11. Fidélisation Client (Pie Chart) -> YEARLY
  const loyaltyVisits = React.useMemo(() => {
    const clientsVisits = {};
    currentYearHistory.forEach(h => {
      const nom = String(h.Nom_Client || "").trim().toUpperCase();
      if (nom && !["PASSANT", "INCONNU", "REVENDEUR", "MODÈLE", "?"].includes(nom)) {
        // On combine Nom + Numéro pour plus de précision si possible
        const num = String(h.Numero_Client || "").replace(/\D/g, "");
        const key = num ? `${nom}_${num}` : nom;
        clientsVisits[key] = (clientsVisits[key] || 0) + 1;
      }
    });
    let habitues = 0;
    let occasionnels = 0;
    Object.values(clientsVisits).forEach(v => {
      if (v > 1) habitues++;
      else occasionnels++;
    });
    return [
      { name: "Habitués (>1 visite)", value: habitues, color: "#e74c3c" },
      { name: "Nouveaux (1 visite)", value: occasionnels, color: "#34495e" }
    ].filter(d => d.value > 0);
  }, [currentYearHistory]);

  // 12. Démographie (Bar Chart) -> YEARLY
  const demographics = React.useMemo(() => {
    const counts = { "Hommes": 0, "Femmes": 0, "Enfants": 0 };

    // Fallback dictionary for name normalization
    const safeCatalog = (catalog && typeof catalog === 'object') ? catalog : {};

    currentYearHistory.forEach(h => {
      // RÈGLE SIMPLE : 1 ticket = 1 personne
      // Le genre est déterminé par le PREMIER article technique trouvé dans le panier
      let genre = null; // "Hommes", "Femmes", "Garçons", "Filles"

      const transactionCat = String(h.Catégorie || "").toUpperCase();

      // Extraction du panier
      let items = [];
      if (h && Array.isArray(h.items_names) && h.items_names.length > 0) {
        items = h.items_names;
      } else if (h && h.Détails) {
        items = h.Détails.split(",").map(s => s.trim());
      }

      // Chercher le genre via le PREMIER article technique du panier
      for (let i = 0; i < items.length; i++) {
        const name = getNormalizedProductName(items[i], safeCatalog);
        const item = safeCatalog[name];
        const cleanNameUpper = String(name).replace(/^[🛒🎨🛍️✂️💆‍♀️📦\s]+/, "").trim().toUpperCase();

        // Ignorer les produits de revente / DIVERS / Carte Cadeau
        if (cleanNameUpper.startsWith("DIVERS") || cleanNameUpper.startsWith("CARTE CADEAU")) continue;
        const f = (item && item.filtre) ? String(item.filtre).toUpperCase() : cleanNameUpper;
        const isRetail = ["VENTE", "DIVERS", "MATERIEL", "ACCESSOIRES"].includes(f) || f.includes("VENTE") || f.includes("REVENTE");
        if (isRetail) continue;

        // Détection du genre
        if (f.includes("HOMME") || f.includes("BARBIER") || f.includes("BARBE") || cleanNameUpper.includes("(M)") || cleanNameUpper.includes("(H)")) {
          genre = "Hommes"; break;
        }
        if (f.includes("JUNIOR") || f.includes("ENFANT") || cleanNameUpper.includes("GARÇON") || cleanNameUpper.includes("GARCON") || cleanNameUpper.includes("FILLE")) {
          genre = "Enfants"; break;
        }
        if (f.includes("DAME") || f.includes("FEMME") || f.includes("ESTHETIQUE") || f.includes("ESTHÉTIQUE") || f.includes("SOINS") || f.includes("CHIGNON") || f.includes("MARIÉE")) {
          genre = "Femmes"; break;
        }
        // Article technique trouvé mais genre non identifié → on continue pour voir les suivants
      }

      // Fallback si aucun article n'a donné de genre
      if (!genre) {
        const allNames = items.map(n => String(n).toUpperCase()).join(" ");
        if (transactionCat.includes("HOMME") || transactionCat.includes("BARB") || allNames.includes("(M)") || allNames.includes("HOMME")) {
          genre = "Hommes";
        } else if (transactionCat.includes("GARCO") || transactionCat.includes("JUNIOR") || transactionCat.includes("FILLE") || allNames.includes("GARÇON") || allNames.includes("GARCON") || allNames.includes("FILLE") || allNames.includes("ENFANT")) {
          genre = "Enfants";
        } else if (Number(h.Total) > 0) {
          genre = "Femmes"; // Défaut salon coiffure
        }
      }

      // +1 personne pour ce ticket
      if (genre) counts[genre]++;
    });

    // Attribuer des couleurs distinctes pour le rendu de la chart
    const colors = {
      "Femmes": "#e84393",
      "Hommes": "#0984e3",
      "Filles": "#fd79a8",
      "Garçons": "#74b9ff"
    };

    return Object.keys(counts).map(name => ({
      name,
      visites: counts[name],
      fill: colors[name] || "#888"
    }));
  }, [currentYearHistory, catalog, getNormalizedProductName]);

  // 13. Taux de Vente Croisée (Jauge) -> MONTHLY
  const crossSellRate = React.useMemo(() => {
    if (currentMonthHistory.length === 0) return 0;

    let mixedTickets = 0;
    const safeCatalog = (catalog && typeof catalog === 'object') ? catalog : {};

    currentMonthHistory.forEach(h => {
      let hasRetail = false;
      let hasTech = false;

      let items = [];
      if (h && Array.isArray(h.items_names) && h.items_names.length > 0) items = h.items_names;
      else if (h && h.Détails) items = h.Détails.split(",").map(s => s.trim());

      if (items.length > 0) {
        items.forEach(rawName => {
          const name = getNormalizedProductName(rawName, safeCatalog);
          const item = safeCatalog[name];
          const isDivers = name.startsWith("DIVERS - ");
          const isGiftCard = name.startsWith("CARTE CADEAU - ");

          let isRetail = false;
          let isTech = false;
          if (item) {
            isRetail = item.type === "retail" || item.type === "both";
            isTech = item.type === "technical" || item.type === "both";
            if (!item.type) {
              const f = String(item.filtre || "").toUpperCase();
              isRetail = ["VENTE", "DIVERS", "MATERIEL", "ACCESSOIRES"].includes(f) || f.includes("VENTE") || f.includes("REVENTE");
              isTech = !isRetail;
            }
          }

          if (isRetail || (isDivers && !isGiftCard)) hasRetail = true;
          if (isTech && !isDivers && !isGiftCard) hasTech = true;
        });
        if (hasRetail && hasTech) mixedTickets++;
      }
    });
    return Math.round((mixedTickets / currentMonthHistory.length) * 100);
  }, [currentMonthHistory, catalog]);

  // 14. Analyse des Jours Creux (Bar Chart) -> YEARLY
  const daysAnalysis = React.useMemo(() => {
    const days = { "Lundi": 0, "Mardi": 0, "Mercredi": 0, "Jeudi": 0, "Vendredi": 0, "Samedi": 0, "Dimanche": 0 };
    currentYearHistory.forEach(h => {
      if (h && h.Date) {
        // Date format is DD/MM/YYYY
        const parts = h.Date.split('/');
        if (parts.length === 3) {
          const dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          const dayIndex = dateObj.getDay(); // 0 is Sunday, 1 is Monday...
          const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
          const dayName = dayNames[dayIndex];
          if (days[dayName] !== undefined && Number(h.Total)) {
            days[dayName] += Number(h.Total);
          }
        }
      }
    });

    // Pour ne garder que les jours d'ouverture (souvent Mardi-Samedi pour les salons)
    return Object.keys(days)
      .filter(d => days[d] > 0 || !["Dimanche", "Lundi"].includes(d)) // Garde lundi/dimanche si CA, sinon masque
      .map(jour => ({
        jour,
        ca: Math.round(days[jour])
      }));
  }, [currentYearHistory]);

  // 15. Évolution du Mix "Prestation vs Revente" (AreaChart)
  const mixCaEvolution = React.useMemo(() => {
    const dailyMix = {};
    const safeCatalog = (catalog && typeof catalog === 'object') ? catalog : {};

    // Helper: normalize any date to DD/MM/YYYY
    const normDate = (d) => {
      if (!d || typeof d !== 'string') return d;
      // If YYYY-MM-DD format, convert to DD/MM/YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const [y, m, dd] = d.split('-');
        return `${dd}/${m}/${y}`;
      }
      return d; // Already DD/MM/YYYY
    };

    currentMonthHistory.forEach(h => {
      if (h && h.Date) {
        const dateKey = normDate(h.Date);
        if (!dailyMix[dateKey]) dailyMix[dateKey] = { date: dateKey, prestations: 0, ventes: 0 };

        let items = [];
        if (Array.isArray(h.items_names) && h.items_names.length > 0) items = h.items_names;
        else if (h.Détails) items = h.Détails.split(",").map(s => s.trim());

        if (items.length > 0) {
          items.forEach((rawName, i) => {
            const name = getNormalizedProductName(rawName, safeCatalog);
            const item = safeCatalog[name];

            let price = (h.items_prices && h.items_prices[i] !== undefined) ? Number(h.items_prices[i]) : 0;
            if (price === 0 && h.Détails) {
              const parts = String(rawName).split(" - ");
              if (parts.length >= 2 && !isNaN(parseFloat(parts[1]))) {
                price = parseFloat(parts[1]);
              } else if (items.length > 0 && h.Total) {
                price = Number(h.Total) / items.length;
              }
            }

            const isDivers = name.startsWith("DIVERS - ");
            const isGiftCard = name.startsWith("CARTE CADEAU - ");

            let isRetail = false;
            if (item) {
              isRetail = item.type === "retail" || item.type === "both";
              if (!item.type) {
                const f = String(item.filtre || "").toUpperCase();
                isRetail = ["VENTE", "DIVERS", "MATERIEL", "ACCESSOIRES"].includes(f) || f.includes("VENTE") || f.includes("REVENTE");
              }
            }

            if (isRetail || (isDivers && !isGiftCard)) {
              dailyMix[dateKey].ventes += price;
            } else {
              dailyMix[dateKey].prestations += price;
            }
          });
        } else if (h.Total) {
          // Ticket sans détails d'items : on ajoute le total en prestations par défaut
          dailyMix[dateKey].prestations += Number(h.Total) || 0;
        }
      }
    });
    return Object.values(dailyMix).sort((a, b) => {
      const partsA = a.date.split('/');
      const partsB = b.date.split('/');
      return new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`) - new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`);
    });
  }, [currentMonthHistory, catalog]);

  // 16. Acquisition vs Rétention (LineChart) -> YEARLY
  const acquisitionRetention = React.useMemo(() => {
    const dailyStats = {};
    const globalSeenClients = new Set();

    // Sort history chronologically FIRST to simulate real-time client discovery
    const sortedHistory = [...currentYearHistory].sort((a, b) => {
      if (!a.Date || !b.Date) return 0;
      const [da, ma, ya] = a.Date.split('/');
      const [db, mb, yb] = b.Date.split('/');
      return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
    });

    sortedHistory.forEach(h => {
      if (h && h.Date && h.Nom_Client && !["Passant", "Inconnu"].includes(h.Nom_Client)) {
        if (!dailyStats[h.Date]) dailyStats[h.Date] = { date: h.Date, habitues: 0, nouveaux: 0 };

        if (globalSeenClients.has(h.Nom_Client)) {
          dailyStats[h.Date].habitues += 1;
        } else {
          dailyStats[h.Date].nouveaux += 1;
          globalSeenClients.add(h.Nom_Client);
        }
      }
    });

    return Object.values(dailyStats);
  }, [currentYearHistory]);

  const renderTeamBars = () => {
    return dynamicStaff.map(name => (
      <Bar
        key={name}
        dataKey={name}
        fill={getStaffColor(name)}
        radius={[4, 4, 0, 0]}
        name={name}
      />
    ));
  };
  const renderTeamLines = () => {
    return dynamicStaff.map(name => (
      <Line
        key={name}
        type="monotone"
        dataKey={name}
        stroke={getStaffColor(name)}
        strokeWidth={4}
        dot={{ r: 5 }}
        activeDot={{ r: 10 }}
        name={name}
      />
    ));
  };
  return (
    <div className="analytics-dashboard" style={{ marginTop: "40px", background: "#f9f9fb", padding: "30px", borderRadius: "20px" }}>
      <h3
        style={{
          fontSize: "24px",
          fontWeight: "800",
          background: "linear-gradient(45deg, #00bfff, #ff1493)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "30px",
          textAlign: "center"
        }}
      >
        ✨ Tableau de Bord Premium MAM ✨</h3>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "30px" }}>

        {/* 1. CA Evolution - YEARLY */}
        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#2c3e50", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            📦  Évolution du CA (Annuel)
          </h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", lineHeight: "1.5" }}>
            Suivez la croissance de votre salon jour après jour. Ce graphique permet de visualiser vos pics de revenus et de mesurer l'impact de vos actions commerciales sur votre chiffre d'affaires total (€).
          </div>
          <div style={{ minHeight: "350px", height: "auto", width: "100%" }}>
            <ResponsiveContainer width="99%" minHeight={350}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff1493" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff1493" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" stroke="#999" fontSize={11} tickMargin={10} />
                <YAxis stroke="#999" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenu"
                  stroke="#ff1493"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenu)"
                  activeDot={{ r: 8 }}
                  name="Chiffre d'Affaires (€)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Row 2: Team Performance - MONTHLY */}
        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#2c3e50", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            📈 Activité Équipe (Points / Mois)
          </h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", lineHeight: "1.5" }}>
            Mesurez la charge de travail réelle de chaque collaboratrice. Chaque prestation compte pour 1 point (service), ce qui permet de comparer l'investissement de chacun dans l'accueil des clients, indépendamment du montant du ticket.
          </div>
          <div style={{ minHeight: "350px", height: "auto", width: "100%" }}>
            <ResponsiveContainer width="99%" minHeight={350}>
              <BarChart data={teamPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" stroke="#999" fontSize={11} tickMargin={10} />
                <YAxis stroke="#999" fontSize={11} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} Points`, "Activite"]}
                  contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend />
                {renderTeamBars()}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: "11px", color: "#999", marginTop: "10px" }}>
            * 1 prestation = 1 point. Si plusieurs personnes sur le ticket sans attribution précise, le point est partagé.
          </p>
        </div>
        {/* 3. Product vs Services Trends */}
        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#9b59b6", marginBottom: "10px" }}> Top 5 Produits (Annuel)</h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", lineHeight: "1.5" }}>
            Identifiez vos produits vedettes en temps réel. Ce suivi vous aide à anticiper vos commandes fournisseurs et à optimiser votre stock pour ne jamais manquer les références préférées de vos clientes.
          </div>
          <div style={{ minHeight: "350px", height: "auto", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={350}>
                <BarChart data={topProductsData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" stroke="#555" fontSize={13} fontWeight="600" angle={-25} textAnchor="end" interval={0} height={80} />
                  <YAxis stroke="#999" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" name="Ventes" radius={[4, 4, 0, 0]}>
                    {topProductsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#999", fontStyle: "italic", alignSelf: "center", width: "100%", textAlign: "center" }}>Aucune donnée suffisante.</div>
            )}
          </div>
        </div>
        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#2ecc71", marginBottom: "10px" }}> Top 5 Prestations (Annuel)</h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", lineHeight: "1.5" }}>
            Analysez la popularité de vos services (coupes, techniques, soins). C'est un indicateur clé pour adapter vos offres, former votre équipe sur les tendances du moment ou mettre en avant vos spécialités.
          </div>
          <div style={{ minHeight: "350px", height: "auto", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {topServicesData.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={350}>
                <PieChart>
                  <Pie
                    data={topServicesData}
                    outerRadius={95}
                    cy="50%"
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topServicesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} fois`, "Réalisations"]} contentStyle={{ borderRadius: "15px", border: "none" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#999", fontStyle: "italic" }}>Aucune donnée suffisante.</div>
            )}
          </div>
        </div>
        {/* 4. Missions Accomplishments & Global Distribution */}
        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#e67e22", marginBottom: "10px" }}> 🎯 Objectifs & Missions (Mois)</h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", lineHeight: "1.5" }}>
            Visualisez l'atteinte des objectifs fixés via l'onglet Missions. Ce graphique encourage la motivation d'équipe en montrant concrètement le nombre de défis (ventes additionnelles, nouveaux services) relevés avec succès.
          </div>
          <div style={{ minHeight: "300px", height: "auto", width: "100%" }}>
            <ResponsiveContainer width="99%" minHeight={300}>
              <BarChart data={missionsPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "15px", border: "none" }} cursor={{ fill: 'transparent' }} />
                <Legend />
                {renderTeamBars()}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#34495e", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            Pie Répartition CA (Mois)
          </h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", textAlign: "center", lineHeight: "1.5" }}>
            Découvrez l'équilibre financier de votre salon entre Prestations et Ventes. La vente de produits est un levier de rentabilité crucial qui complète vos prestations techniques et artistiques.
          </div>
          <div style={{ minHeight: "300px", height: "auto", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {globalDistribution.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={300}>
                <PieChart>
                  <Pie
                    data={globalDistribution}
                    cx="50%"
                    cy="40%"
                    labelLine={false}
                    outerRadius={105}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {globalDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} €`, "Revenu"]}
                    contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#999", fontStyle: "italic" }}>Aucune donnée suffisante.</div>
            )}
          </div>
        </div>
        {/* 5. CA per Collaborator & Payment Methods */}
        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#8e44ad", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            💰 Part CA / Collaborateur (Année)
          </h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", textAlign: "center", lineHeight: "1.5" }}>
            Répartition du chiffre d'affaires total généré par chaque membre de l'équipe. Cela permet de valoriser la contribution financière directe de chacun au développement global du salon.
          </div>
          <div style={{ minHeight: "300px", height: "auto", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {caPerCollaborator.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={300}>
                <PieChart>
                  <Pie
                    data={caPerCollaborator}
                    cx="50%"
                    cy="40%"
                    labelLine={false}
                    outerRadius={105}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {caPerCollaborator.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} €`, "Chiffre d'Affaires"]} contentStyle={{ borderRadius: "15px", border: "none" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#999", fontStyle: "italic" }}>Aucune donnée suffisante.</div>
            )}
          </div>
        </div>
        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#2980b9", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            🏆 Top 10 Clients VIP (Année)
          </h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", textAlign: "center", lineHeight: "1.5" }}>
            Vos clients les plus fidèles en termes de chiffre d'affaires sur l'année mobile.
          </div>
          <div style={{ minHeight: "300px", height: "auto", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {top10ClientsData.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={300}>
                <BarChart data={top10ClientsData} layout="vertical" margin={{ left: 40, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} fontSize={11} stroke="#666" />
                  <Tooltip formatter={(value) => [`${value} €`, "CA Annuel"]} contentStyle={{ borderRadius: "15px", border: "none" }} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {top10ClientsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#999", fontStyle: "italic" }}>Aucune donnée suffisante.</div>
            )}
          </div>
        </div>
        {/* 6. Hourly Traffic & Average Cart */}
        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#1abc9c", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            ⏰ Cloche d'Affluence (Jour)
          </h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", lineHeight: "1.5" }}>
            Identifiez les "heures de pointe" de votre salon. Utilisez ces données pour optimiser vos plannings, gérer les temps de pause ou prévoir des renforts lors des créneaux les plus fréquentés.
          </div>
          <div style={{ minHeight: "300px", height: "auto", width: "100%" }}>
            <ResponsiveContainer width="99%" minHeight={300}>
              <AreaChart data={hourlyTraffic}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1abc9c" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1abc9c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="heure" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "15px", border: "none" }} />
                <Legend />
                <Area type="monotone" dataKey="tickets" stroke="#1abc9c" fillOpacity={1} fill="url(#colorTraffic)" name="Nombre de Tickets" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "white", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#d35400", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            📈 Panier Moyen (Mois) - Objectif 40€
          </h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", lineHeight: "1.5" }}>
            Suivez la dépense moyenne par cliente (€/Visite). Augmenter ce panier moyen est l'un des moyens les plus efficaces pour accroître votre CA sans forcément avoir plus de clients.
          </div>
          <div style={{ minHeight: "300px", height: "auto", width: "100%" }}>
            <ResponsiveContainer width="99%" minHeight={300}>
              <LineChart data={averageCartBasket}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} domain={[0, dataMax => Math.max(dataMax, 45)]} />
                <Tooltip formatter={(value) => [`${value} €`, "Panier Moyen"]} contentStyle={{ borderRadius: "15px", border: "none" }} />
                <Legend />
                <ReferenceLine y={40} stroke="#e74c3c" strokeDasharray="3 3" label={{ position: 'right', value: 'Objectif 40€', fill: '#e74c3c', fontSize: 10 }} />
                <Line type="monotone" dataKey="panier" stroke="#d35400" strokeWidth={4} activeDot={{ r: 8 }} name="Moyenne (€/Ticket)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* 7. Loyalty, Demographics & Cross-Sell */}
        <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#c0392b", marginBottom: "10px", fontSize: "14px", textAlign: "center" }}> 🤝 Fidélisation (Année)</h4>
          <div style={{ fontSize: "11px", color: "#7f8c8d", marginBottom: "10px", fontStyle: "italic", textAlign: "center", lineHeight: "1.4" }}>
            Mesurez la fidélité : les "Clients Fidèles" sont venus plus d'une fois sur la période, tandis que les "Nouveaux" vous découvrent pour la première fois.
          </div>
          <div style={{ minHeight: "200px", height: "auto", width: "100%", display: "flex", justifyContent: "center" }}>
            {loyaltyVisits.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={200}>
                <PieChart>
                  <Pie data={loyaltyVisits} cx="50%" cy="40%" innerRadius={35} outerRadius={75} fill="#8884d8" dataKey="value">
                    {loyaltyVisits.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Clients`, "Nombre"]} contentStyle={{ borderRadius: "10px", border: "none" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ color: "#999", fontStyle: "italic", alignSelf: "center", fontSize: "12px" }}>Données insuffisantes</div>}
          </div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#f39c12", marginBottom: "10px", fontSize: "14px", textAlign: "center" }}> 👶 Démographie (Année)</h4>
          <div style={{ fontSize: "11px", color: "#7f8c8d", marginBottom: "10px", fontStyle: "italic", textAlign: "center", lineHeight: "1.4" }}>
            Mieux comprendre qui sont vos client(e)s. La répartition entre Hommes, Femmes et Enfants vous permet d'adapter vos services et vos gammes de produits en rayon.
          </div>
          <div style={{ minHeight: "200px", height: "auto", width: "100%", display: "flex", justifyContent: "center" }}>
            {demographics.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={200}>
                <BarChart data={demographics} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={10} hide />
                  <YAxis dataKey="name" type="category" fontSize={10} width={100} tick={{ fill: "#666" }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: "10px", border: "none", padding: "5px 10px" }} />
                  <Bar dataKey="visites" radius={[0, 4, 4, 0]} name="Visites" barSize={20}>
                    {demographics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: "#999", fontStyle: "italic", alignSelf: "center", fontSize: "12px" }}>Données non renseignées</div>}
          </div>
        </div>
        <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h4 style={{ color: "#27ae60", marginBottom: "15px", fontSize: "14px", textAlign: "center" }}> 🛒 Vente Croisée (Mois)</h4>
          <div style={{ fontSize: "11px", color: "#7f8c8d", textAlign: "center", marginBottom: "15px", padding: "0 10px", fontStyle: "italic", lineHeight: "1.4" }}>
            Mesure la fréquence à laquelle une cliente repart avec un produit boutique après une prestation. Un taux élevé est la signature d'un conseil expert et d'une vente maîtrisée.
          </div>

          <div style={{ position: "relative", display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#eee" strokeWidth="15" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#27ae60"
                strokeWidth="15"
                strokeDasharray={`${(crossSellRate / 100) * 314} 314`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1s ease-out" }}
              />
            </svg>
            <div style={{ position: "absolute", fontWeight: "900", fontSize: "24px", color: "#27ae60" }}>
              {crossSellRate}%
            </div>
          </div>
          <div style={{ fontSize: "10px", color: "#999", marginTop: "15px" }}>
            Le nerf de la rentabilité !
          </div>
        </div>
        {/* 8. Analyse des Jours Creux (CA par Jour de la semaine) */}
        <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#8e44ad", marginBottom: "10px", fontSize: "14px", textAlign: "center" }}> 📅 Jours Creux (Année)</h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", textAlign: "center", lineHeight: "1.5" }}>
            Identifiez les jours de la semaine les plus calmes. Ces données sont précieuses pour lancer des offres spéciales ciblées (ex: promos le mardi) ou pour ajuster vos plannings.
          </div>
          <div style={{ minHeight: "350px", height: "auto", width: "100%", display: "flex", justifyContent: "center" }}>
            {daysAnalysis.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={350}>
                <BarChart data={daysAnalysis} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="jour" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={10} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [`${value} €`, "CA Mensuel"]} contentStyle={{ borderRadius: "10px", border: "none" }} />
                  <Bar dataKey="ca" fill="#8e44ad" radius={[4, 4, 0, 0]} name="Chiffre d'Affaires (€)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: "#999", fontStyle: "italic", alignSelf: "center", fontSize: "12px" }}>Données insuffisantes</div>}
          </div>
        </div>
        {/* 9. Évolution du Mix "Prestation vs Revente" */}
        <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#2980b9", marginBottom: "10px", fontSize: "14px", textAlign: "center" }}> ⚖️ Mix Presta/Produit (Mois)</h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", textAlign: "center", lineHeight: "1.5" }}>
            Observez l'équilibre quotidien entre vos services et vos ventes de produits. Cela permet de vérifier si votre équipe maintient un effort constant de conseil boutique.
          </div>
          <div style={{ minHeight: "350px", height: "auto", width: "100%", display: "flex", justifyContent: "center" }}>
            {mixCaEvolution.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={350}>
                <AreaChart data={mixCaEvolution} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="date" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "none" }} />
                  <Legend />
                  <Area type="monotone" dataKey="prestations" stackId="1" stroke="#9b59b6" fill="#9b59b6" fillOpacity={0.6} strokeWidth={2} name="Service" />
                  <Area type="monotone" dataKey="ventes" stackId="1" stroke="#2ecc71" fill="#2ecc71" fillOpacity={0.6} strokeWidth={2} name="Produit" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ color: "#999", fontStyle: "italic", alignSelf: "center", fontSize: "12px" }}>Données insuffisantes</div>}
          </div>
        </div>
        {/* 10. Acquisition vs Rétention */}
        <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h4 style={{ color: "#d35400", marginBottom: "10px", fontSize: "14px", textAlign: "center" }}> 🧲 Acquisition (Année)</h4>
          <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "15px", fontStyle: "italic", textAlign: "center", lineHeight: "1.5" }}>
            Visualisez le dynamisme de votre fichier client. Voyez si vous recrutez suffisamment de nouvelles têtes chaque jour pour compenser le renouvellement de votre clientèle habituée.
          </div>
          <div style={{ minHeight: "350px", height: "auto", width: "100%", display: "flex", justifyContent: "center" }}>
            {acquisitionRetention.length > 0 ? (
              <ResponsiveContainer width="99%" minHeight={350}>
                <LineChart data={acquisitionRetention} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="date" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "none" }} />
                  <Legend />
                  <Line type="monotone" dataKey="habitues" stroke="#e74c3c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Clients Fidèles (>1)" />
                  <Line type="monotone" dataKey="nouveaux" stroke="#34495e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Nouveaux Clients" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ color: "#999", fontStyle: "italic", alignSelf: "center", fontSize: "12px" }}>Données insuffisantes</div>}
          </div>
        </div>
      </div>

    </div>
  );
};
const MainApp = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isRemoteScanner =
    urlParams.get("mode") === "scanner" || window.location.hash === "#scanner";
  const EXPECTED_DRIVE_FILENAME = "SAUVEGARDE.json";

  // Helper global : normaliser une date (DD/MM/YYYY, DD-MM-YYYY ou YYYY-MM-DD) en YYYY-MM-DD
  const normalizeDate = (d) => {
    if (!d || typeof d !== "string") return "";
    // Robust parsing for common formats: DD/MM/YYYY or DD-MM-YYYY
    const slashParts = d.split("/");
    if (slashParts.length === 3) {
      const [dd, mm, yyyy] = slashParts;
      if (yyyy.length === 4) return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    const dashParts = d.split("-");
    if (dashParts.length === 3) {
      // Check if it's already YYYY-MM-DD
      if (dashParts[0].length === 4) return d;
      // Assume DD-MM-YYYY
      const [dd, mm, yyyy] = dashParts;
      if (yyyy.length === 4) return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return d;
  };

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("COIFFURE");
  const [coiffureSubTab, setCoiffureSubTab] = useState(null); // HOMME, FEMME, ENFANT (Starts null)
  const [venteSubTab, setVenteSubTab] = useState(null); // PRODUIT, DIVERS (Starts null)
  const [peerId, setPeerId] = useState(null);
  const [remoteConn, setRemoteConn] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  // receivedScans is now initialized below with lazy loading
  const [scannerIp, setScannerIp] = useState("192.168.1.162");
  const isMobile = window.innerWidth <= 768;
  // --- HELPERS POUR PERSISTENCE ---
  const safeParse = (key, defaultValue) => {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    try {
      const parsed = JSON.parse(stored);
      if (parsed === null) return defaultValue;

      // Validation de type stricte
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
      if (typeof defaultValue === 'object' && defaultValue !== null && (typeof parsed !== 'object' || Array.isArray(parsed))) return defaultValue;

      return parsed;
    } catch (e) {
      return defaultValue;
    }
  };
  const [catalog, setCatalog] = useState(() =>
    safeParse("catalog_v2", DEFAULT_CATALOG),
  );
  const [history, setHistory] = useState(() => {
    // BOOT RESTORATION: Si on était en mode archive au dernier refresh,
    // on restaure les données LIVE pour éviter que checkAutoArchive ne re-archive les données d'archive
    const storedSnapshot = safeParse("liveHistorySnapshot", null);
    if (storedSnapshot && storedSnapshot.history) {
      // On était en mode archive -> restaurer le live
      localStorage.removeItem("liveHistorySnapshot");
      localStorage.removeItem("activeArchiveMonth");
      return Array.isArray(storedSnapshot.history) ? storedSnapshot.history : [];
    }
    return safeParse("history", []);
  });
  const [cart, setCart] = useState([]);
  const [cartPriceOverrides, setCartPriceOverrides] = useState({});
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(null); // Initial filter null
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    return new Date().toLocaleDateString("sv-SE");
  });
  const [reportViewMode, setReportViewMode] = useState("monthly");
  useEffect(() => {
    if (!selectedDay || typeof selectedDay !== "string") return;
    const m = (selectedDay || "").slice(0, 7);
    if (m && selectedMonth !== m) setSelectedMonth(m);
  }, [selectedDay]);
  const [clients, setClients] = useState(() => safeParse("clients", []));
  const [clientSearch, setClientSearch] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const qrScannerRef = useRef(null);
  //  États encaissement
  const [client, setClient] = useState({ nom: "", prenom: "", num: "", id: null });
  const [remise, setRemise] = useState(0);
  const [retraitAmount, setRetraitAmount] = useState(0);
  const [retraitCategory, setRetraitCategory] = useState("");
  const [cadeau, setCadeau] = useState(0);
  const [payMode, setPayMode] = useState(null); // CB, Esp, Chq, Multi (Starts null)
  const [amounts, setAmounts] = useState({ esp: 0, chq: 0, cb: 0 });
  const STAFF_NAMES = [];
  const [selectedCashiers, setSelectedCashiers] = useState([]);
  const [cartStaff, setCartStaff] = useState({}); // { 0: "Manon", 1: "Magalie" }
  const [cashierName, setCashierName] = useState(() =>
    localStorage.getItem("cashierName") || "",
  );
  const [isSelectingClient, setIsSelectingClient] = useState(false);
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  const [reportsFolderHandle, setReportsFolderHandle] = useState(null);
  const [inventory, setInventory] = useState(() => {
    const inv = safeParse("inventory_v4", { technique: [], vente: [] });
    // Migration basique si besoin : s'assurer que les structures sont là
    if (!inv.technique) inv.technique = [];
    if (!inv.vente) inv.vente = [];
    return inv;
  });
  const [invEntries, setInvEntries] = useState(() => safeParse("invEntries", []));
  const [archives, setArchives] = useState(() => {
    const raw = safeParse("archives", {});
    // BOOT CLEANUP: Deduplication immediate des archives au chargement
    const cleaned = { ...raw };
    let changed = false;
    Object.keys(cleaned).forEach(month => {
      const data = cleaned[month];
      if (Array.isArray(data)) {
        const seen = new Set();
        const unique = data.filter(h => {
          const hid = h?.id ? String(h.id) : `${h?.Date || ""}-${h?.Total || 0}-${h?.client?.nom || "anon"}`;
          if (h && !seen.has(hid)) {
            seen.add(hid);
            return true;
          }
          return false;
        });
        if (unique.length !== data.length) {
          cleaned[month] = unique;
          changed = true;
        }
      }
    });
    if (changed) {
      // Sauvegarder immediatement le nettoyage
      try { localStorage.setItem("archives", JSON.stringify(cleaned)); } catch (e) { }
    }
    return changed ? cleaned : raw;
  });
  const [favorites, setFavorites] = useState(() => safeParse("favorites", []));
  const [trash, setTrash] = useState(() => safeParse("trash", { catalog: {}, clients: [], inventory: [] }));
  const [stockSearch, setStockSearch] = useState(""); // Recherche dans les stocks
  const [stockTab, setStockTab] = useState("vente"); // FIX: Missing state causing crash
  const stockTabRef = useRef(stockTab);

  // Helper global pour normaliser DD/MM/YYYY vers YYYY-MM-DD pour comparaisons
  const normalizeDateToISO = normalizeDate;

  const capitalize = (str) => {
    if (!str || typeof str !== "string") return "";
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };

  const getCorrectEmoji = (type) => {
    if (type === "retail") return "🛍️";
    if (type === "technical") return "🎨";
    if (type === "both") return "🛍️🎨";
    return "";
  };

  const cleanProductName = (name) => {
    if (!name || typeof name !== "string") return "";
    let cleaned = name.trim();
    // 1. Suppression EXPLICITE des emojis de type caddy/palette qui énervent l'utilisateur
    cleaned = cleaned.replace(/^[🛒🎨🛍️💇‍♂️💄👤🚀📦🛍️]+/gu, "");
    // 2. Suppression de tout ce qui n'est pas une lettre, chiffre ou parenthèse au début
    cleaned = cleaned.replace(/^[^\p{L}\p{N}\(\)\[\]]+/gu, "");
    return (cleaned.trim() || name).toUpperCase(); // Fallback to original if completely stripped (shouldn't happen)
  };
  useEffect(() => {
    stockTabRef.current = stockTab;
  }, [stockTab]);
  const [isRecordingInvoice, setIsRecordingInvoice] = useState(false);
  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);
  const [selectedGammeForStock, setSelectedGammeForStock] = useState(""); // Pour le rapport d'inventaire
  const [activeStockBrandFilter, setActiveStockBrandFilter] = useState(null);
  // --- PREVIEW STATE ---
  const [previewData, setPreviewData] = useState(null); // AOA data for preview
  const [previewTitle, setPreviewTitle] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]); // [{nom, quantite, type, prix}]
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
  const [invoiceSearchCategory, setInvoiceSearchCategory] = useState("");
  const [editingStockOldName, setEditingStockOldName] = useState(null);
  const [newItemState, setNewItemState] = useState({
    nom: "",
    sortOrder: "",
    barcode: "",
    prixAchat: "",
    prixVente: "",
    category: "PRODUIT",
    type: "retail",
    gamme: "",
    fournisseur: "",
    quantity: 1,
  });
  const [newItemSuggestions, setNewItemSuggestions] = useState([]);
  const [showNewItemSuggestions, setShowNewItemSuggestions] = useState(false);
  const startEditStockItem = (productName) => {
    const item = catalog[productName];
    if (!item) return;
    setActiveTab("STOCKS");
    setStockTab(item.type === "retail" ? "vente" : "technique");
    setIsRecordingInvoice(true);
    setIsAddingNewProduct(true);
    setEditingStockOldName(productName);
    const invList = inventory[item.type === "retail" ? "vente" : "technique"] || [];
    const invItem = invList.find((i) => i.nom === productName);

    setNewItemState({
      nom: productName,
      sortOrder:
        item.sortOrder === 0 || item.sortOrder
          ? String(item.sortOrder)
          : "",
      barcode: item.barcode || "",
      prixAchat: item.prixAchat ? String(item.prixAchat) : "",
      prixVente: item.prixVente ? String(item.prixVente) : "",
      category: item.filtre === "DIVERS" ? "DIVERS" : "PRODUIT",
      type: item.type || (stockTab === "vente" ? "retail" : "technical"),
      gamme: item.gamme || "",
      fournisseur: item.fournisseur || "",
      quantity: invItem ? invItem.quantite : 0,
    });
  };
  const extractLeadingSortOrderFromName = (rawName) => {
    if (!rawName || typeof rawName !== "string") return null;
    const trimmed = rawName.trim();
    // Match: "7.12 Nom" / "7,12 Nom" / "7.12- Nom" / "7.12: Nom"
    const m = trimmed.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:[- ?":])?\s+(.+)$/);
    if (!m) return null;
    const sortRaw = m[1].replace(",", ".");
    const rest = (m[2] || "").trim();
    if (!rest) return null;
    const n = parseFloat(sortRaw);
    if (Number.isNaN(n)) return null;
    return { sortOrder: n, cleanedName: rest };
  };
  // const [invEntries, setInvEntries] = useState(() =>
  //   safeParse("invEntries_v4", {}),
  // );
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  // const [archives, setArchives] = useState(() => {
  //   const raw = safeParse("archives", {});
  //   if (Array.isArray(raw)) {
  //     const migrated = {};
  //     raw.forEach((a) => {
  //       if (a.month) migrated[a.month] = a.data || [];
  //     });
  //     return migrated;
  //   }
  //   return raw;
  // });
  const [activeArchiveMonth, setActiveArchiveMonth] = useState(null);
  const [liveHistorySnapshot, setLiveHistorySnapshot] = useState(null);
  const [expandedArchiveMonth, setExpandedArchiveMonth] = useState(null);
  const [expandedArchiveDay, setExpandedArchiveDay] = useState(null);
  const [showDiversModal, setShowDiversModal] = useState(false);
  const [diversData, setDiversData] = useState({
    name: "",
    price: "",
    payMode: "CB",
  });

  const enterArchiveMonth = useCallback(
    (monthKey, preferredDay = null) => {
      // SÉCURITÉ : ne JAMAIS entrer en mode archive pour le mois calendrier actuel
      const now = new Date();
      const systemMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      if (monthKey === systemMonth) {
        console.warn("Tentative d'entrer en mode archive pour le mois courant bloquée :", monthKey);
        return;
      }

      const arcData = archives[monthKey];
      // On autorise l'entrée même si arcData est null pour permettre la création à la volée
      const dataToLoad = Array.isArray(arcData) ? arcData : [];
      if (!activeArchiveMonth && !liveHistorySnapshot) {
        setLiveHistorySnapshot({
          history,
          selectedMonth,
          selectedDay,
        });
      }
      setActiveArchiveMonth(monthKey);
      setHistory(dataToLoad);
      setSelectedMonth(monthKey);
      const dayToUse =
        preferredDay && String(preferredDay).startsWith(`${monthKey}-`)
          ? preferredDay
          : `${monthKey}-01`;
      setSelectedDay(dayToUse);
      setReportViewMode("monthly"); // Toujours repasser en mode mensuel quand on change de mois/archive
    },
    [
      archives,
      history,
      selectedDay,
      selectedMonth,
      liveHistorySnapshot,
      activeArchiveMonth,
    ],
  );
  const exitArchiveMonth = useCallback(
    (overrideDate = {}) => {
      const snapshot = liveHistorySnapshot;
      setLiveHistorySnapshot(null);
      setActiveArchiveMonth(null);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
      const currentDayStr = String(now.getDate()).padStart(2, "0");
      const systemMonth = `${currentYear}-${currentMonthStr}`;
      const systemDate = `${currentYear}-${currentMonthStr}-${currentDayStr}`;
      if (snapshot) {
        setHistory(snapshot.history || []);
      }

      setSelectedMonth(overrideDate.month || systemMonth);
      setSelectedDay(overrideDate.day || systemDate);
      setReportViewMode("monthly"); // Reset mode lors de la sortie d'archive
    },
    [liveHistorySnapshot],
  );
  useEffect(() => {
    if (!activeArchiveMonth) return;
    // SÉCURITÉ : On ne synchronise vers l'archive que si les Données correspondent au mois actif
    if (history.length > 0) {
      const firstDate = normalizeDate(history[0].Date);
      if (firstDate && !firstDate.startsWith(activeArchiveMonth)) {
        console.warn(
          "Safety: Rejecting sync of mismatched history to archive",
          firstDate,
          activeArchiveMonth,
        );
        return;
      }
    } else {
      // Pour éviter de créer d'innombrables archives "fantômes" quand l'utilisateur tape une date (ex: 0002-02),
      // on n'enregistre un historique vide QUE s'il existait déjà préalablement.
      setArchives((prev) => {
        if (!(activeArchiveMonth in prev)) return prev;

        // Clean up immediately any completely empty ghost archives we might stumble upon
        const newArchives = { ...prev, [activeArchiveMonth]: [] };
        Object.keys(newArchives).forEach(key => {
          if (Array.isArray(newArchives[key]) && newArchives[key].length === 0) {
            delete newArchives[key];
          }
        });
        return newArchives;
      });
      return;
    }
    setArchives((prev) => {
      const newArchives = { ...prev, [activeArchiveMonth]: history };
      // Auto-nettoyage des archives fantômes vides existantes
      Object.keys(newArchives).forEach(key => {
        if (Array.isArray(newArchives[key]) && newArchives[key].length === 0) {
          delete newArchives[key];
        }
      });
      return newArchives;
    });
  }, [history, activeArchiveMonth]);

  // Unification de l'accès à l'historique (Fusion Live + Archives) avec déduplication stricte par ID
  const allTransactions = useMemo(() => {
    const safeHistoryLocal = Array.isArray(history) ? history : [];
    const safeArchives = (archives && typeof archives === 'object' && !Array.isArray(archives)) ? archives : {};

    // On fusionne tout
    let allRaw = [...safeHistoryLocal];
    Object.values(safeArchives).forEach(monthData => {
      if (Array.isArray(monthData)) allRaw = [...allRaw, ...monthData];
    });

    // Déduplication par ID pour éviter les doublons quand history est chargé depuis archives
    const unique = [];
    const seen = new Set();
    allRaw.forEach(t => {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    });
    return unique;
  }, [history, archives]);

  // --- FAVORITES STATE ---
  // const [favorites, setFavorites] = useState(() => safeParse("favorites", []));
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Accès Patronne
  // const [trash, setTrash] = useState(() =>
  //   safeParse("trash", {
  //     catalog: {},
  //     clients: [],
  //     inventory: [],
  //     transactions: [],
  //   }),
  // );
  useEffect(() => {
    localStorage.setItem("cashierName", cashierName);
  }, [cashierName]);
  useEffect(() => {
    if (!favorites) return;
    if (Array.isArray(favorites)) {
      setFavorites({ GLOBAL: favorites });
    }
  }, []);
  const getFavoritesContextKey = () => {
    if (activeTab === "COIFFURE") {
      return `COIFFURE_${coiffureSubTab || "GLOBAL"}`;
    }
    if (activeTab === "ESTHÉTIQUE") return "ESTHETIQUE";
    if (activeTab === "VENTE") return "VENTE";
    return activeTab || "GLOBAL";
  };
  const getFavoriteContextKeyForItem = (itemName) => {
    const item = catalog?.[itemName];
    if (!item) return getFavoritesContextKey();
    if (item.type === "retail") return "VENTE";
    const f = String(item.filtre || "").toUpperCase();
    const coiffureFilters = [
      "HOMME",
      "JUNIOR",
      "DAME COURTS",
      "DAME LONGS",
      "TECHNIQUE COURTS",
      "TECHNIQUE LONGS",
      "TECHNIQUE SEULE",
      "SOINS",
      "TECHNIQUE HOMME",
    ];
    if (coiffureFilters.includes(f) || f.includes("DAME") || f.includes("HOMME")) {
      if (f.includes("HOMME")) return "COIFFURE_HOMME";
      if (f.includes("JUNIOR") || f.includes("ENFANT")) return "COIFFURE_ENFANT";
      return "COIFFURE_FEMME";
    }
    return "ESTHETIQUE";
  };
  const didNormalizeFavoritesRef = useRef(false);
  useEffect(() => {
    if (didNormalizeFavoritesRef.current) return;
    if (!favorites || Array.isArray(favorites)) return;
    if (!catalog) return;
    const source = favorites || {};
    const normalized = {};
    Object.values(source).forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((name) => {
        if (!name) return;
        const key = getFavoriteContextKeyForItem(name);
        if (!normalized[key]) normalized[key] = [];
        if (!normalized[key].includes(name)) normalized[key].push(name);
      });
    });
    const sourceKeys = Object.keys(source).sort();
    const normalizedKeys = Object.keys(normalized).sort();
    const sourceFlat = sourceKeys
      .flatMap((k) => (Array.isArray(source[k]) ? source[k].map((x) => `${k}:${x}`) : []))
      .sort();
    const normalizedFlat = normalizedKeys
      .flatMap((k) => (Array.isArray(normalized[k]) ? normalized[k].map((x) => `${k}:${x}`) : []))
      .sort();
    if (JSON.stringify(sourceFlat) !== JSON.stringify(normalizedFlat)) {
      setFavorites(normalized);
    }
    didNormalizeFavoritesRef.current = true;
  }, [favorites, catalog, getFavoriteContextKeyForItem]);
  useEffect(() => {
    if (!favorites || Array.isArray(favorites)) return;
    if (!catalog) return;
    // Migration: si on a des vieux favoris stockés en GLOBAL, on les redispatch par Catégorie.
    const globalList = Array.isArray(favorites.GLOBAL) ? favorites.GLOBAL : [];
    if (globalList.length === 0) return;
    setFavorites((prev) => {
      if (!prev || Array.isArray(prev)) return prev;
      const next = { ...prev };
      globalList.forEach((name) => {
        const item = catalog?.[name];
        if (!item) return;
        // Vente
        if (item.type === "retail") {
          const key = "VENTE";
          const arr = Array.isArray(next[key]) ? next[key] : [];
          if (!arr.includes(name)) next[key] = [...arr, name];
          return;
        }
        // Coiffure / Esthétique basées sur le filtre
        const f = String(item.filtre || "").toUpperCase();
        const coiffureFilters = [
          "HOMME",
          "JUNIOR",
          "DAME COURTS",
          "DAME LONGS",
          "TECHNIQUE COURTS",
          "TECHNIQUE LONGS",
          "TECHNIQUE SEULE",
          "SOINS",
          "TECHNIQUE HOMME",
        ];
        if (coiffureFilters.includes(f) || f.includes("DAME") || f.includes("HOMME") || f.includes("JUNIOR")) {
          const key = getFavoriteContextKeyForItem(name);
          const arr = Array.isArray(next[key]) ? next[key] : [];
          if (!arr.includes(name)) next[key] = [...arr, name];
          return;
        }
        // Sinon esthétique
        {
          const key = "ESTHETIQUE";
          const arr = Array.isArray(next[key]) ? next[key] : [];
          if (!arr.includes(name)) next[key] = [...arr, name];
        }
      });
      delete next.GLOBAL;
      return next;
    });
  }, [favorites, catalog]);
  const getFavoritesListForContext = (ctxKey) => {
    if (!favorites) return [];
    if (Array.isArray(favorites)) return favorites;
    return favorites[ctxKey] || [];
  };
  const isItemFavoriteInContext = (itemName, ctxKey) => {
    const list = getFavoritesListForContext(ctxKey);
    return list.includes(itemName);
  };
  const toggleFavoriteInContext = (itemName, ctxKey) => {
    setFavorites((prev) => {
      // S'assurer que prev est un objet
      let next = {};
      if (!prev) {
        next = { [ctxKey]: [itemName] };
      } else if (Array.isArray(prev)) {
        // Migration d'un ancien format tableau
        next = { GLOBAL: prev };
      } else {
        next = { ...prev };
      }

      const list = Array.isArray(next[ctxKey]) ? [...next[ctxKey]] : [];
      if (list.includes(itemName)) {
        next[ctxKey] = list.filter((f) => f !== itemName);
      } else {
        next[ctxKey] = [...list, itemName];
      }
      return next;
    });
  };
  const renameFavoriteEverywhere = (oldName, newName) => {
    setFavorites((prev) => {
      if (!prev) return prev;
      if (Array.isArray(prev)) {
        return prev.map((f) => (f === oldName ? newName : f));
      }
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (!Array.isArray(next[k])) return;
        next[k] = next[k].map((f) => (f === oldName ? newName : f));
      });
      return next;
    });
  };
  const removeFavoriteEverywhere = (name) => {
    setFavorites((prev) => {
      if (!prev) return prev;
      if (Array.isArray(prev)) return prev.filter((f) => f !== name);
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (!Array.isArray(next[k])) return;
        next[k] = next[k].filter((f) => f !== name);
      });
      return next;
    });
  };
  const [receivedScans, setReceivedScans] = useState(() =>
    safeParse("receivedScans", []),
  );
  const [scannedProductForAction, setScannedProductForAction] = useState(null); // { nom, barcode, type }
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null); // { callback: () => void, title: "" }
  const [passwordInput, setPasswordInput] = useState("");
  const [fileHandle, setFileHandle] = useState(null); // Pour l'Auto-Sync Drive
  const [isDriveVerifying, setIsDriveVerifying] = useState(false);
  const [isDriveInitialized, setIsDriveInitialized] = useState(false); // Empêche l'écrasement au démarrage
  const [isSavingToDrive, setIsSavingToDrive] = useState(false); // Nouvel état pour indiquer si une écriture est en cours
  const [technicalNote, setTechnicalNote] = useState("");
  const [technicalSuggestions, setTechnicalSuggestions] = useState([]);
  const [showTechnicalSuggestions, setShowTechnicalSuggestions] = useState(false);
  const [viewingTechnicalHistoryId, setViewingTechnicalHistoryId] =
    useState(null);
  const [showTechnicalNoteArea, setShowTechnicalNoteArea] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState(null); // Pour l'édition dans l'onglet Client
  const [editingNoteText, setEditingNoteText] = useState("");
  const [showTicketDétail, setShowTicketDétail] = useState(true);
  const [showDailySales, setShowDailySales] = useState(true);
  const [isAddingNewNote, setIsAddingNewNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  // Nouveaux états Phase 2
  const [inventoryMode, setInventoryMode] = useState(false);
  const [missions, setMissions] = useState(() => {
    const saved = localStorage.getItem("missions_hairaude");
    return saved ? JSON.parse(saved) : [];
  });
  const hasPendingMissions = useMemo(() => {
    return missions.some(m => m.statut !== "ARCHIVE");
  }, [missions]);
  const [activeMissionTab, setActiveMissionTab] = useState("EN_COURS"); // EN_COURS, ARCHIVES
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);
  const [newMissionData, setNewMissionData] = useState({
    titre: "",
    description: "",
  });
  const [showVerifyMissionModal, setShowVerifyMissionModal] = useState(null); // ID de la mission à vérifier
  const [managerPassword, setManagerPassword] = useState("");
  const [lastScannedProduct, setLastScannedProduct] = useState(null);
  const [pendingOrders, setPendingOrders] = useState(() =>
    safeParse("pending_orders_hairaude", []),
  );
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);
  // Nouveaux états pour modaux personnalisés
  const [customPopup, setCustomPopup] = useState({
    show: false,
    type: "alert",
    title: "",
    message: "",
    onConfirm: null,
  });
  const [receiptModal, setReceiptModal] = useState({
    show: false,
    productName: "",
    type: "retail",
  });
  //  États pour l'Assistant de Fin de Journée
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [clôtureStep, setClosureStep] = useState(1);
  const [hasDoneClosureToday, setHasDoneClosureToday] = useState(() => {
    const saved = safeParse("has_done_clôture_hairaude", {
      date: "",
      done: false,
    });
    const today = new Date().toLocaleDateString("sv-SE");
    return saved.date === today ? saved.done : false;
  });
  const [isCheckingClosurePassword, setIsCheckingClosurePassword] =
    useState(false);
  // Persistence des dates
  // --- RÉCUPÉRATION AUTOMATIQUE DES DONNÉES AU DÉMARRAGE ---
  useEffect(() => {
    // Migration: ensure unique IDs for all clients
    setClients(prev => {
      if (!prev || !Array.isArray(prev)) return prev;
      const seenIds = new Set();
      let changed = false;
      const next = prev.map(c => {
        let id = c.id;
        if (!id || seenIds.has(id)) {
          id = Date.now() + Math.floor(Math.random() * 1000000);
          changed = true;
        }
        seenIds.add(id);
        return { ...c, id };
      });
      return changed ? next : prev;
    });

    let recovered = [];

    // === RÉCUPÉRATION HISTORIQUE ===
    if (history.length === 0) {
      try {
        const histBackup = JSON.parse(localStorage.getItem("history_backup") || "[]");
        if (Array.isArray(histBackup) && histBackup.length > 0) {
          setHistory(histBackup);
          recovered.push(`Historique (${histBackup.length} transactions)`);
        }
      } catch (e) { console.error("Erreur récup historique:", e); }
    }

    // === RÉCUPÉRATION CATALOGUE ===
    if (Object.keys(catalog).length < 10) {
      try {
        const catBackup = JSON.parse(localStorage.getItem("catalog_backup") || "{}");
        if (catBackup && Object.keys(catBackup).length > Object.keys(catalog).length) {
          setCatalog(catBackup);
          recovered.push(`Catalogue (${Object.keys(catBackup).length} articles)`);
        }
      } catch (e) { console.error("Erreur récup catalogue:", e); }
    }

    // === RÉCUPÉRATION INVENTAIRE ===
    const invCount = (inventory.technique?.length || 0) + (inventory.vente?.length || 0);
    if (invCount === 0) {
      try {
        const invBackup = JSON.parse(localStorage.getItem("inventory_backup") || "{}");
        const invBackupCount = (invBackup.technique?.length || 0) + (invBackup.vente?.length || 0);
        if (invBackupCount > 0) {
          setInventory(invBackup);
          recovered.push(`Inventaire (${invBackupCount} produits)`);
        }
      } catch (e) { console.error("Erreur récup inventaire:", e); }
    }

    // === RÉCUPÉRATION CLIENTS ===
    if (clients.length <= 2) {
      // Tentative 1 : Restaurer depuis le backup
      try {
        const backup = JSON.parse(localStorage.getItem("clients_backup") || "[]");
        if (Array.isArray(backup) && backup.length > clients.length) {
          setClients(backup);
          recovered.push(`Clients (${backup.length} depuis backup)`);
        } else {
          // Tentative 2 : Restaurer depuis la corbeille
          const trashData = JSON.parse(localStorage.getItem("trash") || "{}");
          if (Array.isArray(trashData.clients) && trashData.clients.length > 0) {
            const merged = [...clients];
            trashData.clients.forEach(tc => {
              if (!merged.find(c => c.nom === tc.nom && c.prenom === tc.prenom)) {
                merged.push(tc);
              }
            });
            if (merged.length > clients.length) {
              setClients(merged);
              recovered.push(`Clients (${merged.length - clients.length} depuis corbeille)`);
            }
          }
          // Tentative 3 : Reconstruire depuis l'historique
          if (!recovered.find(r => r.includes("Clients"))) {
            const hist = JSON.parse(localStorage.getItem("history") || localStorage.getItem("history_backup") || "[]");
            if (Array.isArray(hist) && hist.length > 0) {
              const clientMap = {};
              hist.forEach(h => {
                const nom = h.Nom_Client;
                if (nom && nom !== "Passant" && nom.trim()) {
                  const key = nom.toUpperCase().trim();
                  if (!clientMap[key]) {
                    clientMap[key] = {
                      id: Date.now() + Math.random() * 1000,
                      nom: nom.toUpperCase().trim(), prenom: "",
                      num: h.Numero_Client || "", visites: 0,
                      visitesCoiffure: 0, visitesEsthetique: 0,
                      notesTechniques: [],
                    };
                  }
                  clientMap[key].visites++;
                  if (h.Numero_Client && !clientMap[key].num) clientMap[key].num = h.Numero_Client;
                }
              });
              const rc = Object.values(clientMap);
              const merged2 = [...clients];
              rc.forEach(r => {
                if (!merged2.find(c => c.nom.toUpperCase() === r.nom.toUpperCase())) merged2.push(r);
              });
              if (merged2.length > clients.length) {
                setClients(merged2);
                recovered.push(`Clients (${merged2.length - clients.length} depuis historique)`);
              }
            }
          }
        }
      } catch (e) { console.error("Erreur récup clients:", e); }
    }

    // Notification (uniquement en console pour rester discret)
    if (recovered.length > 0) {
      console.warn("🔄 Récupération automatique effectuée :", recovered);
    }
  }, []); // Exécuté une seule fois au démarrage

  // --- MIGRATION CLIENTS (Capitalize) ---
  useEffect(() => {
    const hasMigrated = localStorage.getItem("migration_clients_capitalize");
    if (!hasMigrated && clients && clients.length > 0) {
      setClients(prev => {
        let changed = false;
        const next = prev.map(c => {
          const newNom = (c.nom || "").toUpperCase();
          const newPrenom = (c.prenom || "").toUpperCase();
          if (c.nom !== newNom || c.prenom !== newPrenom) {
            changed = true;
            return { ...c, nom: newNom, prenom: newPrenom };
          }
          return c;
        });
        if (changed) {
          localStorage.setItem("migration_clients_capitalize", "true");
          return next;
        }
        localStorage.setItem("migration_clients_capitalize", "true");
        return prev;
      });
    }
  }, [clients]);

  useEffect(() => {
    localStorage.setItem("selectedMonth", selectedMonth);
  }, [selectedMonth]);
  useEffect(() => {
    localStorage.setItem("selectedDay", selectedDay);
  }, [selectedDay]);

  // --- MIGRATION EMOJIS (Automatique - V9 PURE NAME) ---
  // Supprime DEFINITIVEMENT les emojis des noms stockés
  useEffect(() => {
    const hasMigrated = localStorage.getItem("migration_emojis_v9_pure_name");
    if (!hasMigrated && catalog && Object.keys(catalog).length > 0) {
      setCatalog(prev => {
        const next = { ...prev };
        let changed = false;
        const newInventory = { ...inventory };
        let invChanged = false;

        const currentKeys = Object.keys(next);
        currentKeys.forEach(oldKey => {
          const item = next[oldKey];
          if (!item) return;

          const pureName = cleanProductName(oldKey);
          const newKey = pureName; // Plus d'emoji du tout dans la clé ! (cleanProductName now returns uppercase)

          if (oldKey !== newKey) {
            // Fusion si nécessaire
            if (next[newKey] && newKey !== oldKey) {
              next[newKey] = { ...next[newKey], ...item };
            } else {
              next[newKey] = { ...item };
            }
            delete next[oldKey];
            changed = true;

            // Mise à jour Inventaire
            ["vente", "technique"].forEach(tab => {
              if (newInventory[tab]) {
                newInventory[tab] = newInventory[tab].map(it => {
                  if (cleanProductName(it.nom) === pureName) {
                    invChanged = true;
                    return { ...it, nom: newKey };
                  }
                  return it;
                });
              }
            });

            // Mise à jour Commandes
            setPendingOrders(prevO =>
              prevO.map(o => cleanProductName(o.nom) === pureName ? { ...o, nom: newKey } : o)
            );
          }
        });

        if (changed || true) {
          if (invChanged) setInventory(newInventory);
          localStorage.setItem("migration_emojis_v9_pure_name", "true");
          console.log(" 💎 Migration PURE NAME V9 effectuée ! Plus d'emojis en stock.");
          return next;
        }
        localStorage.setItem("migration_emojis_v9_pure_name", "true");
        return prev;
      });
    }
  }, [catalog, inventory]);
  // Custom Modals States
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [giftCardData, setGiftCardData] = useState({ amount: "", name: "" });
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    id: null,
    nom: "",
    prenom: "",
    num: "",
  });
  useEffect(() => {
    localStorage.setItem("missions_hairaude", JSON.stringify(missions));
  }, [missions]);
  useEffect(() => {
    localStorage.setItem(
      "pending_orders_hairaude",
      JSON.stringify(pendingOrders),
    );
  }, [pendingOrders]);
  useEffect(() => {
    const today = new Date().toLocaleDateString("sv-SE");
    localStorage.setItem(
      "has_done_clôture_hairaude",
      JSON.stringify({ date: today, done: hasDoneClosureToday }),
    );
  }, [hasDoneClosureToday]);
  // Alerte de fermeture du site si récap non fait
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const stats = getTodayStats();
      if (!hasDoneClosureToday && stats.count > 0) {
        const msg =
          " 🚪 Attention ! N'oubliez pas de faire votre petit récap avec la lune avant de partir !";
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasDoneClosureToday, history]);
  const lastScanTimeRef = useRef(0);
  const activeTabRef = useRef(activeTab);
  const catalogRef = useRef(catalog);
  const isRecordingRef = useRef(isRecordingInvoice);
  const isAddingNewRef = useRef(isAddingNewProduct);
  const invoiceItemsRef = useRef(invoiceItems);
  const cartRef = useRef(cart);
  const newItemStateRef = useRef(newItemState);
  const inventoryRef = useRef(inventory);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);
  useEffect(() => {
    isRecordingRef.current = isRecordingInvoice;
  }, [isRecordingInvoice]);
  useEffect(() => {
    isAddingNewRef.current = isAddingNewProduct;
  }, [isAddingNewProduct]);
  useEffect(() => {
    newItemStateRef.current = newItemState;
  }, [newItemState]);
  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);
  // Migration UNIQE : On passe les seuils techniques de 2 à 1
  useEffect(() => {
    if (isDriveInitialized) {
      const isMigrated = localStorage.getItem("seuil_v4_migrated_tech");
      if (!isMigrated) {
        setCatalog((prev) => {
          const next = { ...prev };
          let changed = false;
          Object.keys(next).forEach((name) => {
            if (
              next[name].type === "technical" &&
              (next[name].seuilAlerte === 2 || !next[name].seuilAlerte)
            ) {
              // On Supprimé la valeur explicite si c'est 2 pour que le nouveau défaut (1) s'applique
              delete next[name].seuilAlerte;
              changed = true;
            }
          });
          if (changed) return next;
          return prev;
        });
        localStorage.setItem("seuil_v4_migrated_tech", "true");
      }
    }
  }, [isDriveInitialized]);
  // Migration UNIQE : extraire les préfixes type "7.12" du NOM vers sortOrder (Tri)
  useEffect(() => {
    if (!isDriveInitialized) return;
    const migrationKey = "stock_sortorder_prefix_migration_v1";
    if (localStorage.getItem(migrationKey)) return;
    let renameMap = {};
    let didSomething = false;
    setCatalog((prev) => {
      const next = { ...prev };
      Object.keys(prev).forEach((name) => {
        const item = prev[name];
        if (!item) return;
        if (!(item.type === "retail" || item.type === "technical")) return;
        const extracted = extractLeadingSortOrderFromName(name);
        if (!extracted) return;
        const cleanedName = extracted.cleanedName;
        // Avoid collision
        if (next[cleanedName]) return;
        renameMap[name] = cleanedName;
        didSomething = true;
        const merged = {
          ...item,
          sortOrder:
            typeof item.sortOrder === "number" && !Number.isNaN(item.sortOrder)
              ? item.sortOrder
              : extracted.sortOrder,
        };
        delete next[name];
        next[cleanedName] = merged;
      });
      return next;
    });
    if (Object.keys(renameMap).length > 0) {
      setInventory((prev) => {
        const next = { ...prev };
        ["vente", "technique"].forEach((tab) => {
          if (!Array.isArray(next[tab])) return;
          next[tab] = next[tab].map((it) => {
            const newNom = renameMap[it.nom];
            return newNom ? { ...it, nom: newNom } : it;
          });
        });
        return next;
      });
      setPendingOrders((prev) =>
        prev.map((o) => {
          const newNom = renameMap[o.nom];
          return newNom ? { ...o, nom: newNom } : o;
        }),
      );
    }
    if (didSomething) {
      localStorage.setItem(migrationKey, "true");
    } else {
      // Even if nothing to do, mark as done to avoid re-running every load
      localStorage.setItem(migrationKey, "true");
    }
  }, [isDriveInitialized]);
  // --- CHARGEMENT PERSISTANCE DRIVE (IDB) ---
  useEffect(() => {
    const initDrive = async () => {
      try {
        const handle = await loadHandleFromIDB();
        if (handle) {
          setFileHandle(handle);
          if (
            (await handle.queryPermission({ mode: "readwrite" })) === "granted"
          ) {
            loadFromDrive(handle);
          } else {
            setIsDriveVerifying(true);
          }
        }
      } catch (e) {
        console.error("IDB Load failed:", e);
      }
    };
    initDrive();
  }, []);
  // --- MIGRATION AUTOMATIQUE CATALOGUE & INVENTAIRE (Cumuls) ---
  useEffect(() => {
    const migrationKey = "catalog_migration_v8_complete";
    if (!localStorage.getItem(migrationKey)) {
      console.log(
        " Exécution de la migration v8 (Produits Techniques + Cumuls)...",
      );
      // 1. Catalogue
      setCatalog((prev) => {
        const newCat = { ...prev };
        let count = 0;
        Object.entries(NEW_TECHNICAL_PRODUCTS || {}).forEach(([name, data]) => {
          if (!newCat[name]) {
            newCat[name] = data;
            count++;
          }
        });
        return newCat;
      });
      // 2. Initialisation des cumuls dans l'inventaire
      setInventory((prev) => {
        const newInv = { ...prev };
        ["vente", "technique"].forEach((tab) => {
          if (newInv[tab]) {
            newInv[tab] = newInv[tab].map((item) => ({
              ...item,
              cumulEntrees:
                item.cumulEntrees !== undefined
                  ? item.cumulEntrees
                  : item.quantite,
              cumulSorties:
                item.cumulSorties !== undefined ? item.cumulSorties : 0,
            }));
          }
        });
        return newInv;
      });
      localStorage.setItem(migrationKey, "true");
    }
  }, []);
  // Migration 2026-02-B-v3 : Enrichissement Catalogue (Produits Techniques) - RUN AFTER DRIVE LOAD
  useEffect(() => {
    if (!isDriveInitialized) return;
    const migrationKey = "catalog_migration_2026_02_v3_complete";
    if (!localStorage.getItem(migrationKey)) {
      console.log(
        " Exécution de la migration 2026-02-B-v3 (Produits Techniques Post-Drive)...",
      );
      // 1. Mise à jour du Catalogue
      setCatalog((prev) => {
        const newCat = { ...prev };
        Object.entries(NEW_CATALOG_ITEMS_2026_02).forEach(([name, data]) => {
          // On force la mise à jour pour inclure le fournisseur si nécessaire (ou l'emoji)
          newCat[name] = data;
        });
        return newCat;
      });
      // 2. Initialisation dans l'Inventaire Technique
      setInventory((prev) => {
        const newInv = { ...prev };
        if (!newInv.technique) newInv.technique = [];
        Object.entries(NEW_CATALOG_ITEMS_2026_02).forEach(([name]) => {
          const exists = newInv.technique.find((it) => it.nom === name);
          if (!exists) {
            newInv.technique.push({
              nom: name,
              quantite: 0,
              cumulEntrees: 0,
              cumulSorties: 0,
            });
          }
        });
        return newInv;
      });
      localStorage.setItem(migrationKey, "true");
    }
  }, [isDriveInitialized]);
  // Migration 2026-02-B-cleanup : Nettoyage "undefined" dans l'historique et la liste clients
  useEffect(() => {
    if (!isDriveInitialized) return;
    const migrationKey = "history_client_name_cleanup_v1";
    if (localStorage.getItem(migrationKey)) return;

    let historyChanged = false;
    setHistory((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.map((h) => {
        if (h && h.Nom_Client && String(h.Nom_Client).includes("undefined")) {
          historyChanged = true;
          return {
            ...h,
            Nom_Client: String(h.Nom_Client).replace(/undefined/g, "").replace(/\s+/g, " ").trim() || "Passant",
          };
        }
        return h;
      });
      return historyChanged ? next : prev;
    });

    let clientsChanged = false;
    setClients((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.map((c) => {
        let changed = false;
        let newNom = c.nom;
        let newPrenom = c.prenom;
        if (typeof c.nom === "string" && c.nom.includes("undefined")) {
          newNom = c.nom.replace(/undefined/g, "").replace(/\s+/g, " ").trim();
          changed = true;
        }
        if (typeof c.prenom === "string" && c.prenom.includes("undefined")) {
          newPrenom = c.prenom.replace(/undefined/g, "").replace(/\s+/g, " ").trim();
          changed = true;
        }
        if (changed) {
          clientsChanged = true;
          return { ...c, nom: newNom, prenom: newPrenom };
        }
        return c;
      });
      return clientsChanged ? next : prev;
    });

    localStorage.setItem(migrationKey, "true");
  }, [isDriveInitialized]);

  // Migration 2026-02-B-ids : Assurer que chaque client a un identifiant unique (Fix bug suppression)
  useEffect(() => {
    if (!isDriveInitialized) return;
    const migrationKey = "clients_id_check_v1";
    if (localStorage.getItem(migrationKey)) return;

    let changed = false;
    setClients((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.map((c) => {
        if (!c.id) {
          changed = true;
          // Génération d'un ID unique robuste (timestamp + partie aléatoire)
          return { ...c, id: Date.now() + Math.floor(Math.random() * 1000000) };
        }
        return c;
      });
      return changed ? next : prev;
    });

    localStorage.setItem(migrationKey, "true");
  }, [isDriveInitialized]);

  // --- GESTION SCANNER PHYSIQUE (Global Keydown) ---
  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeyTime = 0;
    const handleGlobalKeyDown = (e) => {
      // 1. Détection de vitesse
      const now = Date.now();
      const isFastTyping = now - lastKeyTime < 100; // Les scanners sont très rapides
      lastKeyTime = now;
      // 2. Si on appuie sur Entrée
      if (e.key === "Enter") {
        if (barcodeBuffer.length > 3 && isFastTyping) {
          // Si on a un buffer long ET que la dernière touche était rapide, on considère un scan
          handlePhysicalScan(barcodeBuffer);
          barcodeBuffer = "";
          e.preventDefault(); // On ne bloque Entrée QUE si on a détecté un scan
        } else {
          // Sinon on reset le buffer pour la suite
          barcodeBuffer = "";
        }
      }
      // 3. Capturer les caractères simples
      else if (e.key.length === 1) {
        // On n'ajoute au buffer que si c'est rapide ou si le buffer commence
        if (barcodeBuffer === "" || isFastTyping) {
          barcodeBuffer += e.key;
        } else {
          barcodeBuffer = e.key; // On recommence si c'est de la frappe lente
        }
        // Sécurité : Reset après 2s d'inactivité
        if (window._barcodeTimeout) clearTimeout(window._barcodeTimeout);
        window._barcodeTimeout = setTimeout(() => {
          barcodeBuffer = "";
        }, 2000);
      }
    };
    // On écoute sur window EN DEHORS des inputs si possible, mais sans bloquer
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
      if (window._barcodeTimeout) clearTimeout(window._barcodeTimeout);
    };
  }, [catalog, activeTab]);
  // Fonction unifiée de traitement de scan (Physique ou Virtuel/Remote)
  const handlePhysicalScan = (code) => {
    console.log(" 📦  Scan Physique détecté :", code);
    const now = Date.now();
    const lastCode = window.lastScannedBarcodeRef;
    const lastTime = window.lastScanTimeRef || 0;
    // 1. Sécurité Globale (2s)
    if (now - lastTime < 2000) {
      console.log(" ⚠️  Sécurité globale (2s) : Scan ignoré");
      return;
    }
    // 2. Sécurité Même Produit (10s)
    if (code === lastCode && now - lastTime < 10000) {
      console.log(
        " ⚠️  Même produit détecté : Attendre 10s entre deux scans identiques",
      );
      return;
    }
    window.lastScannedBarcodeRef = code;
    window.lastScanTimeRef = now;
    handleScanAction(code);
  };
  // Logique Centrale d'Action Scan
  const handleScanAction = (code) => {
    const pName = Object.keys(catalogRef.current).find(
      (name) => catalogRef.current[name].barcode === code,
    );
    // On bascule toujours sur l'onglet STOCKS pour la gestion
    if (activeTabRef.current !== "STOCKS") setActiveTab("STOCKS");
    if (pName) {
      // Produit EXISTANT : Redirection vers la modification
      const catItem = catalogRef.current[pName];
      const tab = (catItem.type === "technical") ? "technique" : "vente";
      const invList = inventoryRef.current[tab] || [];
      const invItem = invList.find((i) => i.nom === pName);

      setStockTab(tab);
      setIsRecordingInvoice(true);
      setIsAddingNewProduct(true);
      setEditingStockOldName(pName);

      setNewItemState({
        nom: pName,
        sortOrder: catItem.sortOrder === 0 || catItem.sortOrder ? String(catItem.sortOrder) : "",
        barcode: catItem.barcode || "",
        prixAchat: catItem.prixAchat ? String(catItem.prixAchat) : "",
        prixVente: catItem.prixVente ? String(catItem.prixVente) : "",
        category: catItem.filtre === "DIVERS" ? "DIVERS" : "PRODUIT",
        type: catItem.type || (tab === "vente" ? "retail" : "technical"),
        gamme: catItem.gamme || "",
        fournisseur: catItem.fournisseur || "",
        quantity: invItem ? invItem.quantite : 0,
      });
    } else {
      // Produit INCONNU : Formulaire de création auto
      setNewItemState({ ...newItemStateRef.current, barcode: code, reference: code });
      setIsRecordingInvoice(true);
      setIsAddingNewProduct(true);

      const msg = document.createElement("div");
      msg.innerHTML = " ➕ Nouveau produit détecté : " + code;
      msg.style.cssText =
        "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:var(--primary); color:white; padding:15px 30px; borderRadius:50px; zIndex:100000; fontWeight:bold; boxShadow:0 10px 30px rgba(0,0,0,0.3);";
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
    }
  };
  // --- RE-AUTHENTICATION ON TAB FOCUS ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (
          activeTabRef.current === "EXCEL" ||
          activeTabRef.current === "HISTORIQUE DES ARCHIVES"
        ) {
          console.log("Tab visible & protected: Resetting auth");
          setIsAuthenticated(false);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  useEffect(() => {
    const checkAutoArchive = () => {
      if (activeArchiveMonth) return; // Ne pas archiver si on est déjà en mode archive

      // Mois calendrier réel de MAINTENANT (ex: "2026-02")
      const now = new Date();
      const systemMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // On cherche des transactions qui ne sont PAS du mois calendrier actuel
      const oldTransactions = (history || []).filter(
        (h) => {
          if (!h || !h.Date) return false;
          const norm = normalizeDate(h.Date);
          return norm && !norm.startsWith(systemMonth);
        },
      );
      if (oldTransactions.length > 0) {
        console.log(
          "Changement de mois détecté. Archivage automatique en cours...",
        );
        const monthsToArchive = [
          ...new Set(oldTransactions.map((h) => normalizeDate(h.Date).slice(0, 7))),
        ];
        setArchives((prev) => {
          const newArchives = { ...prev };
          monthsToArchive.forEach((mKey) => {
            const monthData = oldTransactions.filter((h) =>
              normalizeDate(h.Date).startsWith(mKey),
            );
            if (newArchives[mKey]) {
              // Dédoublonnage robuste par ID ou Triple (Date-Total-Client)
              const existingKeys = new Set(newArchives[mKey].map(h =>
                h.id || `${normalizeDate(h.Date)}-${h.Total}-${h.client?.nom}`
              ));
              const uniqueNew = monthData.filter(h => {
                const hKey = h.id || `${normalizeDate(h.Date)}-${h.Total}-${h.client?.nom}`;
                return h && hKey && !existingKeys.has(hKey);
              });
              newArchives[mKey] = [...newArchives[mKey], ...uniqueNew];
            } else {
              newArchives[mKey] = monthData;
            }
          });
          return newArchives;
        });
        setHistory((prev) =>
          prev.filter((h) => normalizeDate(h.Date).startsWith(systemMonth)),
        );
        const toast = document.createElement("div");
        toast.innerHTML =
          "✅ <strong>Mois archivé automatiquement !</strong> Vos anciennes Données sont dans l'historique.";
        toast.style.cssText =
          "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#27ae60; color:white; padding:15px 30px; borderRadius:50px; zIndex:100000; boxShadow:0 5px 15px rgba(0,0,0,0.3); animation: slideDown 0.3s forwards, fadeOut 2s 3s forwards;";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
      }
    };
    checkAutoArchive();
  }, [history, selectedMonth, selectedDay]);
  const handleDateNavigation = (value, type) => {
    if (!value) return;
    const now = new Date();
    const systemMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const targetMonth = type === "day" ? value.slice(0, 7) : value;
    if (targetMonth === systemMonth) {
      if (activeArchiveMonth) {
        exitArchiveMonth({
          month: type === "month" ? value : targetMonth,
          day: type === "day" ? value : null,
        });
      } else {
        if (type === "day") setSelectedDay(value);
        if (type === "month") setSelectedMonth(value);
      }
    } else {
      if (activeArchiveMonth !== targetMonth) {
        enterArchiveMonth(targetMonth, type === "day" ? value : null);
        if (type === "month") setSelectedMonth(value);
      } else {
        if (type === "day") setSelectedDay(value);
        if (type === "month") setSelectedMonth(value);
      }
    }
  };
  useEffect(() => {
    invoiceItemsRef.current = invoiceItems;
  }, [invoiceItems]);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  // --- NOUVEAU SERVICE STATE ---
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [lowStockFilter, setLowStockFilter] = useState("Tous");
  const [newServiceData, setNewServiceData] = useState({
    name: "",
    price: "",
    category: "",
    isSpecial: false,
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false); // Toggle for input vs select
  const [editingServiceOldName, setEditingServiceOldName] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const requestAccess = (title, callback, isSecurityLock = false) => {
    setPasswordAction({ callback, title, isSecurityLock });
    setPasswordInput("");
    setIsPasswordModalOpen(true);
  };
  const handlePasswordSubmit = (e) => {
    if (e) e.preventDefault();
    if (passwordInput === "") {
      // Mot de passe Patronne
      setIsPasswordModalOpen(false);
      if (passwordAction.callback) passwordAction.callback();
      setPasswordAction(null);
    } else {
      alert("❌Mot de passe incorrect.");
      setPasswordInput("");
    }
  };
  const PasswordModal = () => {
    if (!isPasswordModalOpen) return null;
    const isSecurityLock = passwordAction?.isSecurityLock;
    return (
      <div className={`modal-overlay ${isSecurityLock ? "security-lock" : ""}`}>
        <div className="modal-content">
          <h3>{isSecurityLock ? "ACCÈS SÉCURISÉ" : " 📦  Sécurité"}</h3>
          <p>
            {passwordAction?.title ||
              "Veuillez entrer le mot de passe pour continuer"}
          </p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              className="password-input"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
              placeholder="••••••••••••"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="pay-btn"
                style={{ background: "#7f8c8d" }}
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  // Si c'est un verrouillage d'onglet, on revient au premier onglet
                  if (isSecurityLock) setActiveTab("COIFFURE");
                }}
              >
                ANNULER
              </button>
              <button type="submit" className="pay-btn">
                VALIDER
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setSearch("");
    // Sortir du mode inventaire si on change d'onglet
    if (tabId !== "STOCKS") {
      setInventoryMode(false);
      setLastScannedProduct(null);
    }
    // Sécurité renforcée : On réinitialise l'authentification si on quitte les onglets protégés
    if (tabId !== "EXCEL" && tabId !== "HISTORIQUE DES ARCHIVES") {
      setIsAuthenticated(false);
    }
    // Protection des onglets
    if (
      (tabId === "EXCEL" || tabId === "HISTORIQUE DES ARCHIVES") &&
      !isAuthenticated
    ) {
      requestAccess(
        `Accès réservé à l'onglet ${tabId}. Entrez le mot de passe :`,
        () => {
          setIsAuthenticated(true);
          setActiveTab(tabId);
        },
        true,
      ); // TRUE = SECURITY LOCK (OPAQ)
    } else {
      setActiveTab(tabId);
    }
  };
  const handleAddService = () => {
    const { name, price, category } = newServiceData;
    if (!name.trim() || !price || !category) {
      alert("❌Veuillez remplir tous les champs (Nom, Prix, Catégorie) !");
      return;
    }
    // Check conflict only if name changed (or new)
    if (name !== editingServiceOldName && catalog[name]) {
      alert("❌Une prestation avec ce nom existe déjà !");
      return;
    }
    setCatalog((prev) => {
      const newCat = { ...prev };
      // If editing and name changed, remove old key
      if (editingServiceOldName && editingServiceOldName !== name) {
        delete newCat[editingServiceOldName];
      }
      // Add/Update
      newCat[name] = {
        prixAchat: 0,
        prixVente: parseFloat(price),
        filtre: category,
        isSpecial: newServiceData.isSpecial,
        type: prev[editingServiceOldName]?.type || undefined, // Preserve type if exists (shouldn't for services)
      };
      if (!newCat[name].type) delete newCat[name].type; // Ensure clean service
      return newCat;
    });
    // Update favorites if name changed
    if (
      editingServiceOldName &&
      editingServiceOldName !== name &&
      (Array.isArray(favorites)
        ? favorites.includes(editingServiceOldName)
        : Object.values(favorites || {}).some(
          (arr) => Array.isArray(arr) && arr.includes(editingServiceOldName),
        ))
    ) {
      renameFavoriteEverywhere(editingServiceOldName, name);
    }
    alert(
      editingServiceOldName
        ? ` ✅ Prestation modifiée avec succès !`
        : ` ✅ Prestation "${name}" ajoutée avec succès !`,
    );
    setShowNewServiceModal(false);
    setNewServiceData({ name: "", price: "", category: "" });
    setIsCustomCategory(false);
    setEditingServiceOldName(null);
  };
  // Chargement des Données au démarrage
  useEffect(() => {
    // Chargement des handles IndexedDB
    const initHandles = async () => {
      // 1. Demander au navigateur de ne jamais effacer ces données si possible
      if (navigator.storage && navigator.storage.persist) {
        try {
          const isPersisted = await navigator.storage.persist();
          console.log(`Données persistantes : ${isPersisted ? "OUI" : "NON (soumis au nettoyage du navigateur)"}`);
        } catch (e) {
          console.error("Erreur navigator.storage.persist", e);
        }
      }

      // 2. Chargement des handles
      const driveH = await loadHandleFromIDB("drive_handle");
      if (driveH) {
        setFileHandle(driveH);
        try {
          const perm = await driveH.queryPermission({ mode: "readwrite" });
          if (perm === "granted") {
            await loadFromDrive(driveH);
          }
        } catch (e) {
          console.error("Erreur queryPermission au démarrage", e);
        }
      }

      const reportsH = await loadHandleFromIDB("reports_handle");
      if (reportsH) {
        setReportsFolderHandle(reportsH);
      }
    };
    initHandles();

    const peer = new Peer({
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });
    peer.on("open", (id) => {
      setPeerId(id);
    });
    peer.on("connection", (conn) => {
      setRemoteConn(conn);
      conn.on("data", (data) => {
        // --- Logique de traitement AMÉLIORÉE (Anti-Rebond Intelligent) ---
        const now = Date.now();
        const lastCode = window.lastScannedBarcodeRef;
        const lastTime = lastScanTimeRef.current || 0;
        // 1. Sécurité Globale (2s)
        if (now - lastTime < 2000) {
          console.log(" ⚠️  Sécurité globale (2s) : Scan ignoré");
          return;
        }
        // 2. Sécurité Même Produit (10s)
        if (data === lastCode && now - lastTime < 10000) {
          console.log(
            " ⚠️  Même produit détecté : Attendre 10s entre deux scans identiques",
          );
          return;
        }
        lastScanTimeRef.current = now;
        window.lastScannedBarcodeRef = data;
        // Historique
        setReceivedScans((prev) =>
          [
            {
              id: Date.now(),
              barcode: data,
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ].slice(0, 5),
        );
        const existingProductKey = Object.keys(catalogRef.current).find(
          (name) => catalogRef.current[name].barcode === data,
        );
        // Envoyer les infos au téléphone si le produit existe
        if (existingProductKey && conn) {
          const catItem = catalogRef.current[existingProductKey];
          const type = catItem.type;
          // Si type "both", on regarde d'abord dans l'onglet courant, sinon vente par défaut
          let finalTab = (type === "technical") ? "technique" : "vente";
          if (type === "both") {
            finalTab = (activeTabRef.current === "STOCKS" && stockTabRef.current === "technique") ? "technique" : "vente";
          }

          const invItem = (inventoryRef.current[finalTab] || []).find(
            (i) => i.nom === existingProductKey,
          );
          conn.send({
            type: "STOCK_INFO",
            data: {
              nom: existingProductKey,
              prixVente: catItem.prixVente,
              quantite: invItem ? invItem.quantite : 0,
              seuilAlerte: catItem.seuilAlerte || 0,
              type: catItem.type,
            },
          });
        }
        // CAS: Scan d'un produit (Indépendant de l'onglet actif pour la redirection)
        if (existingProductKey) {
          const catItem = catalogRef.current[existingProductKey];
          const tab = catItem.type === "technical" ? "technique" : "vente";
          const invList = inventoryRef.current[tab] || [];
          const invItem = invList.find((i) => i.nom === existingProductKey);

          if (activeTabRef.current !== "STOCKS") setActiveTab("STOCKS");
          setStockTab(tab);
          setIsRecordingInvoice(true);
          setIsAddingNewProduct(true);
          setEditingStockOldName(existingProductKey);

          setNewItemState({
            nom: existingProductKey,
            sortOrder: catItem.sortOrder === 0 || catItem.sortOrder ? String(catItem.sortOrder) : "",
            barcode: catItem.barcode || "",
            prixAchat: catItem.prixAchat ? String(catItem.prixAchat) : "",
            prixVente: catItem.prixVente ? String(catItem.prixVente) : "",
            category: catItem.filtre === "DIVERS" ? "DIVERS" : "PRODUIT",
            type: catItem.type || (tab === "vente" ? "retail" : "technical"),
            gamme: catItem.gamme || "",
            fournisseur: catItem.fournisseur || "",
            quantity: invItem ? invItem.quantite : 0,
          });
          return;
        }

        // Si produit inconnu, les comportements spécifiques aux modes s'appliquent
        if (activeTabRef.current === "STOCKS") {
          setSearch(data);
          setNewItemState({
            ...newItemStateRef.current,
            barcode: data,
            reference: data,
          });
          setIsRecordingInvoice(true);
          setIsAddingNewProduct(true);
          // Feedback visuel Recherche
          const msg = document.createElement("div");
          msg.innerHTML = " ➕ Nouveau produit scanné : " + data;
          msg.style.cssText =
            "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:var(--primary); color:white; padding:15px 30px; borderRadius:50px; zIndex:100000; fontWeight:bold; boxShadow:0 10px 30px rgba(0,0,0,0.3);";
          document.body.appendChild(msg);
          setTimeout(() => msg.remove(), 3000);
          return;
        }
        // 2. CAS: Mode Livraison / Création (isRecordingRef est true)
        if (isRecordingRef.current) {
          if (existingProductKey) {
            // Ajout à la livraison
            const itemData = catalogRef.current[existingProductKey];
            setInvoiceItems((prev) => [
              ...prev,
              {
                nom: existingProductKey,
                quantite: 1,
                type: itemData.type,
                prix: itemData.prixAchat,
              },
            ]);
            const msg = document.createElement("div");
            msg.innerHTML = " ✅ " + existingProductKey + " ajouté (Livraison)";
            msg.style.cssText =
              "position:fixed; bottom:20px; right:20px; background:#2ecc71; color:white; padding:10px 20px; borderRadius:10px; zIndex:20000; animation: fadeOut 2s forwards;";
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 2000);
          } else {
            // Produit Inconnu -> Mode Création
            setNewItemState({
              ...newItemStateRef.current,
              barcode: data,
              reference: data,
            });
            setIsRecordingInvoice(true);
            setIsAddingNewProduct(true);
          }
          return;
        }
        // 3. CAS: Vente (Ajout au Panier) - Défaut
        if (existingProductKey) {
          addToCart(existingProductKey);
          const msg = document.createElement("div");
          msg.innerHTML = "✅ " + existingProductKey + " ajouté au panier";
          msg.style.cssText =
            "position:fixed; bottom:20px; right:20px; background:#9b59b6; color:white; padding:10px 20px; borderRadius:10px; zIndex:20000; animation: fadeOut 2s forwards;";
          document.body.appendChild(msg);
          setTimeout(() => msg.remove(), 2000);
        } else {
          // Produit inconnu en mode vente -> Proposer création
          setNewItemState({
            ...newItemStateRef.current,
            barcode: data,
            reference: data,
          });
          setIsRecordingInvoice(true);
          setIsAddingNewProduct(true);
        }
      });
    });
    peer.on("error", (err) => console.error("PC Peer Error:", err));
    return () => {
      peer.destroy();
    };
  }, []); // ID fixe pour toute la session
  // Sauvegarde automatique locale (LocalStorage) + BACKUP de sécurité
  useEffect(() => {
    try {
      // === BACKUPS DE SÉCURITÉ (avant écriture) ===
      // Historique : backup si > 5 transactions
      if (history.length > 5) {
        localStorage.setItem("history_backup", JSON.stringify(history));
      }
      // Clients : backup si > 2 clients
      if (clients.length > 2) {
        localStorage.setItem("clients_backup", JSON.stringify(clients));
      }
      // Catalogue : backup si > 10 items
      if (Object.keys(catalog).length > 10) {
        localStorage.setItem("catalog_backup", JSON.stringify(catalog));
      }
      // Inventaire : backup si non vide
      const invTotal = (inventory.technique?.length || 0) + (inventory.vente?.length || 0);
      if (invTotal > 0) {
        localStorage.setItem("inventory_backup", JSON.stringify(inventory));
      }
      // Favoris : backup si > 0
      if (favorites.length > 0) {
        localStorage.setItem("favorites_backup", JSON.stringify(favorites));
      }

      // === ÉCRITURE PRINCIPALE ===
      localStorage.setItem("history", JSON.stringify(history));
      localStorage.setItem("clients", JSON.stringify(clients));
      localStorage.setItem("catalog_v2", JSON.stringify(catalog));
      localStorage.setItem("inventory_v4", JSON.stringify(inventory));
      localStorage.setItem("invEntries_v4", JSON.stringify(invEntries));
      localStorage.setItem("receivedScans", JSON.stringify(receivedScans));
      localStorage.setItem("archives", JSON.stringify(archives));
      localStorage.setItem("favorites", JSON.stringify(favorites));
      localStorage.setItem("trash", JSON.stringify(trash));
      localStorage.setItem("activeArchiveMonth", activeArchiveMonth || "");
      localStorage.setItem(
        "liveHistorySnapshot",
        JSON.stringify(liveHistorySnapshot),
      );
    } catch (e) {
      console.warn("⚠️ LocalStorage plein ! La sauvegarde continuera uniquement via le fichier Drive.", e);
    }
  }, [
    history,
    clients,
    catalog,
    inventory,
    invEntries,
    receivedScans,
    archives,
    favorites,
    trash,
    activeArchiveMonth,
    liveHistorySnapshot,
  ]);
  // Changement automatique de filtre selon l'onglet
  // --- DERIVED STATE FOR FILTERS ---
  const availableFilters = useMemo(() => {
    return {
      COIFFURE: getDerivedFilters(catalog, "COIFFURE"),
      ESTHETIQUE: getDerivedFilters(catalog, "ESTHETIQUE"),
      VENTE: getDerivedFilters(catalog, "VENTE"),
      TECHNIQUE: getDerivedFilters(catalog, "TECHNIQUE"),
    };
  }, [catalog]);
  useEffect(() => {
    if (activeTab === "ESTHÉTIQUE") setActiveFilter("⭐ FAVORIS");
    else if (activeTab === "VENTE") {
      // Pas de sélection par défaut pour les sous-onglets Vente (comme Coiffure)
      setActiveFilter(null);
    } else if (activeTab === "COIFFURE") {
      // Pas de sélection par défaut pour les sous-onglets Coiffure
      setActiveFilter(null);
    }
  }, [activeTab, availableFilters, coiffureSubTab, venteSubTab]);
  // Calculs Panier
  const cartTotal = (cart || []).reduce((sum, item, idx) => {
    if (!item) return sum;
    const override = cartPriceOverrides?.[idx];
    if (override !== undefined && override !== null && override !== "") {
      return sum + (parseFloat(override) || 0);
    }
    // Si c'est une carte cadeau ou un article Divers (Prix Libre), on extrait le montant du nom
    if (item.startsWith("CARTE CADEAU - ") || item.startsWith("DIVERS - ")) {
      const parts = item.split(" - ");
      const priceStr = parts.find((p) => p && p.includes("€"))?.replace("€", "");
      return sum + (parseFloat(priceStr) || 0);
    }
    return sum + (catalog[item]?.prixVente || 0);
  }, 0);
  const calculatedNet = Math.max(0, cartTotal - (parseFloat(retraitAmount) || 0) - (parseFloat(cadeau) || 0));
  const netToPay = calculatedNet;
  // --- RÉACTIVITÉ UI : Synchronisation des montants de Paiement ---
  const prevNetToPayRef = useRef(netToPay);
  const prevPayModeRef = useRef(payMode);
  useEffect(() => {
    const netChanged = Math.abs(prevNetToPayRef.current - netToPay) > 0.01;
    const modeChanged = prevPayModeRef.current !== payMode;
    if (netChanged || modeChanged) {
      if (payMode === "CB")
        setAmounts({ esp: 0, chq: 0, cb: netToPay });
      else if (payMode === "Esp")
        setAmounts({ esp: netToPay, chq: 0, cb: 0 });
      else if (payMode === "Chq")
        setAmounts({ esp: 0, chq: netToPay, cb: 0 });
      else if (payMode === "Multi") {
        const valEsp = parseFloat(amounts.esp) || 0;
        const valChq = parseFloat(amounts.chq) || 0;
        const valCb = parseFloat(amounts.cb) || 0;
        const currentTotal = valEsp + valChq + valCb;
        if (currentTotal < 0.01) {
          setAmounts({ esp: 0, chq: 0, cb: netToPay });
        } else {
          const ratio = netToPay / currentTotal;
          setAmounts({
            esp: Math.round(valEsp * ratio * 100) / 100,
            chq: Math.round(valChq * ratio * 100) / 100,
            cb: Math.round(valCb * ratio * 100) / 100,
          });
        }
      }
      prevNetToPayRef.current = netToPay;
      prevPayModeRef.current = payMode;
    }
  }, [netToPay, payMode, amounts.esp, amounts.chq, amounts.cb]);
  // --- LOGIQUE ALERTES STOCK ---
  const lowStockItems = useMemo(() => {
    const results = [];
    const safeInventory = inventory || {};
    const safeCatalog = (catalog && typeof catalog === 'object') ? catalog : {};

    const allInvItems = [
      ...(Array.isArray(safeInventory.vente) ? safeInventory.vente : []),
      ...(Array.isArray(safeInventory.technique) ? safeInventory.technique : []),
    ];
    // On itére sur le CATALOGUE pour être sûr de voir les articlés à 0 stock qui ne sont pas encore dans 'inventory'
    Object.keys(safeCatalog).forEach((name) => {
      const catItem = safeCatalog[name];
      if (!catItem) return;
      // Uniquement Vente ou Produits Techniques
      if (!["retail", "technical"].includes(catItem.type)) return;

      const cleanCatalogName = name.replace(/^[🛒🎨]\s*/, "").trim().toLowerCase();
      const matchingInvItems = allInvItems.filter((i) =>
        i.nom.replace(/^[🛒🎨]\s*/, "").trim().toLowerCase() === cleanCatalogName
      );
      const qty = matchingInvItems.reduce((sum, i) => sum + (parseInt(i.quantite) || 0), 0);
      const defaultThreshold = catItem.type === "technical" ? 1 : 2;
      const threshold = catItem.seuilAlerte ?? defaultThreshold;
      if (qty <= threshold) {
        // Même logique que getDerivedFilters pour le filtre affiché
        let derivedFilter = catItem.filtre || "";
        if (catItem.type === "retail" || catItem.type === "both") {
          if (catItem.filtre === "PRODUIT" && catItem.gamme) derivedFilter = catItem.gamme;
        }
        if (catItem.type === "technical" || catItem.type === "both") {
          if (catItem.gamme) derivedFilter = catItem.gamme;
        }
        results.push({
          nom: name,
          quantite: qty,
          seuil: threshold,
          fournisseur: catItem.fournisseur || "Inconnu",
          filtre: catItem.filtre || "",
          derivedFilter,
        });
      }
    });
    return results.sort((a, b) => a.quantite - b.quantite);
  }, [inventory, catalog]);
  const addToOrder = (productName) => {
    if (pendingOrders.find((o) => o.nom === productName)) {
      setCustomPopup({
        show: true,
        type: "alert",
        title: " ⚠️ Déjà en commande",
        message: ` Le produit "${productName}" est déjà présent dans votre liste de commandes à faire.`,
      });
      return;
    }
    const catItem = catalog[productName];
    setPendingOrders((prev) => [
      ...prev,
      {
        nom: productName,
        date: new Date().toISOString().split("T")[0],
        fournisseur: catItem?.fournisseur || "Inconnu",
        type: catItem?.type || "retail",
      },
    ]);
    // Notification visuelle (Toast)
    const toast = document.createElement("div");
    toast.innerHTML = `📦 <strong>${productName}</strong> ajouté aux commandes !`;
    toast.style.cssText =
      "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#3498db; color:white; padding:15px 30px; borderRadius:50px; zIndex:1000000; boxShadow:0 5px 15px rgba(0,0,0,0.3); animation: slideDown 0.3s forwards, fadeOut 2s 3s forwards;";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };
  const validateOrderReceipt = (productName) => {
    const order = pendingOrders.find((o) => o.nom === productName);
    setReceiptModal({
      show: true,
      productName: productName,
      type: order?.type || "retail",
    });
  };
  const finalizeOrderReceipt = (productName, qtyStr, type) => {
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      setCustomPopup({
        show: true,
        type: "alert",
        title: "❌Quantité invalide",
        message: "Veuillez saisir un nombre supérieur à 0.",
      });
      return;
    }
    const tab = type === "technical" ? "technique" : "vente";
    setInventory((prev) => {
      const list = [...(prev[tab] || [])];
      const idx = list.findIndex((i) => i.nom === productName);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          quantite: (list[idx].quantite || 0) + qty,
          cumulEntrees: (list[idx].cumulEntrees || 0) + qty,
        };
      } else {
        list.push({
          id: Date.now() + Math.random(),
          nom: productName,
          quantite: qty,
          cumulEntrees: qty,
          cumulSorties: 0,
          type: type || "retail",
        });
      }
      return { ...prev, [tab]: list };
    });
    setPendingOrders((prev) => prev.filter((o) => o.nom !== productName));
    setReceiptModal({ show: false, productName: "", type: "retail" });
    setCustomPopup({
      show: true,
      type: "alert",
      title: " ✅ Réception validée",
      message: `Le stock de "${productName}" a été augmenté de ${qty}.`,
    });
  };
  const isLastDayOfMonth = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.getMonth() !== today.getMonth();
  };
  const getTodayStats = () => {
    const today = selectedDay || new Date().toLocaleDateString("sv-SE");
    const todayTrans = allTransactions.filter((h) => normalizeDateToISO(h.Date) === today);
    const total = todayTrans.reduce((sum, h) => sum + (h.Total || 0), 0);
    const cb = todayTrans.reduce((sum, h) => sum + (h.Enc_CB || 0), 0);
    const esp = todayTrans.reduce((sum, h) => sum + (h.Enc_Esp || 0), 0);
    const chq = todayTrans.reduce((sum, h) => sum + (h.Enc_Chq || 0), 0);
    const vir = todayTrans.reduce((sum, h) => sum + (h.Enc_Vir || 0), 0); // Note: Enc_Vir maybe not in history yet, but ready for future
    // Répartition Services vs Ventes
    // Vente_Val est calculé lors de handlePayment et stocké dans l'historique
    const vents = todayTrans.reduce((sum, h) => sum + (h.Vente_Val || 0), 0);
    const services = Math.max(0, total - vents);
    return {
      total,
      cb,
      esp,
      chq,
      vir,
      services,
      vents,
      count: todayTrans.length,
    };
  };
  const handleDeleteTransaction = (id) => {
    if (
      !window.confirm(
        "🗑️  Êtes-vous sûr de vouloir Supprimer cette transaction de l'historique ?",
      )
    )
      return;
    const performDelete = () => {
      const trans = allTransactions.find((h) => h.id === id);
      if (trans) {
        // Gestion du stock : Rajouter l'article déduit
        if (trans.items_names && trans.items_names.length > 0) {
          setInventory((prevInv) => {
            const updatedInv = { ...prevInv };
            trans.items_names.forEach((name) => {
              const catItem = catalog[name];
              const tab = (catItem && catItem.type === "technical") ? "technique" : "vente";
              const idx = updatedInv[tab].findIndex((i) => i.nom === name);
              if (idx !== -1) {
                updatedInv[tab][idx] = { ...updatedInv[tab][idx], quantite: updatedInv[tab][idx].quantite + 1 };
              }
            });
            return updatedInv;
          });
        }
        setTrash((prev) => {
          const updated = {
            ...prev,
            transactions: [
              ...(prev.transactions || []),
              {
                ...trans,
                deletedAt: new Date().toISOString(),
                type: "EXCEL_SUPPRESSION",
              },
            ],
          };
          // Sauvegarde immédiate pour éviter la perte en cas de refresh rapide
          try { localStorage.setItem("trash", JSON.stringify(updated)); } catch (e) { }
          return updated;
        });
        // Mise à jour de l'historique (Live ou Archive)
        const transDate = normalizeDateToISO(trans.Date);
        const transMonth = transDate.slice(0, 7);
        const now = new Date();
        const systemMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        if (transMonth === systemMonth || transMonth === activeArchiveMonth) {
          setHistory((prev) => prev.filter((h) => h.id !== id));
        }
        if (transMonth !== systemMonth) {
          setArchives((prev) => {
            if (!prev[transMonth]) return prev;
            return {
              ...prev,
              [transMonth]: prev[transMonth].filter((h) => h.id !== id),
            };
          });
        }
        alert(" ✅ Transaction supprimée avec succès.");
      }
    };
    // Plus de mot de passe pour Supprimer (simplification demandée)
    performDelete();
  };
  const handleEditTransaction = (id) => {
    const performEdit = () => {
      const trans = allTransactions.find((h) => h.id === id);
      if (trans) {
        // 1. Charger dans le panier
        setCart(trans.items_names || []);
        const names = Array.isArray(trans.items_names) ? trans.items_names : [];
        const stored = Array.isArray(trans.items_prices) ? trans.items_prices : [];

        const storedTotal = Number(trans.Total) || 0;
        const retraitTotal = Number(trans.Retrait_Montant) || 0;
        const amountBeforeRetrait = storedTotal + retraitTotal;

        setCartPriceOverrides(() => {
          const stored = Array.isArray(trans.items_prices) ? trans.items_prices : [];
          const next = {};

          // Calcul du total des prix "stockés" pour vérifier la cohérence
          const totalStoredPrices = stored.reduce((acc, p) => acc + (Number(p) || 0), 0);

          for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const storedP = Number(stored[i]);
            if (!Number.isFinite(storedP)) continue;

            // 1. Déterminer le prix par défaut (catalogue)
            let defaultP = 0;
            if (name.startsWith("CARTE CADEAU - ") || name.startsWith("DIVERS - ")) {
              const parts = name.split(" - ");
              const priceStr = parts.find((p) => p && p.includes("€"))?.replace("€", "");
              defaultP = parseFloat(priceStr) || 0;
            } else {
              defaultP = Number(catalog[name]?.prixVente) || 0;
            }

            // 2. Vérifier si ce prix stocké est juste le prix par défaut MOINS la remise proportionnelle
            // On "remonte" le prix stocké pour voir s'il correspond au défaut
            // Si totalStoredPrices est proche de 0, on évite la division par zéro
            let restoredP = storedP;
            if (retraitTotal > 0 && totalStoredPrices > 0.1) {
              // Le ratio de réduction était : storedP / totalStoredPrices
              // Le prix avant remise était : storedP + (retraitTotal * (storedP / totalStoredPrices))
              restoredP = storedP + (retraitTotal * (storedP / totalStoredPrices));
              restoredP = Math.round(restoredP * 100) / 100;
            }

            // Si le prix restauré est différent du prix catalogue, c'est une vraie surcharge manuelle
            if (Math.abs(restoredP - defaultP) > 0.05) {
              next[i] = restoredP;
            }
          }
          return next;
        });
        setClient({ nom: trans.Nom_Client || "", prenom: "", num: trans.Numero_Client || "", id: null });
        setRetraitAmount(trans.Retrait_Montant || 0);
        setRetraitCategory(trans.Retrait_Catégorie || "");
        setCadeau(trans.Enc_Cadeau || 0);
        const initialAmounts = {
          esp: trans.Enc_Esp || 0,
          chq: trans.Enc_Chq || 0,
          cb: trans.Enc_CB || 0,
        };
        const hasEsp = initialAmounts.esp > 0.01;
        const hasChq = initialAmounts.chq > 0.01;
        const hasCb = initialAmounts.cb > 0.01;
        let detectedMode = "CB";
        const activeModesCount = [hasEsp, hasChq, hasCb].filter(Boolean).length;
        if (activeModesCount > 1) detectedMode = "Multi";
        else if (hasEsp) detectedMode = "Esp";
        else if (hasChq) detectedMode = "Chq";
        else detectedMode = "CB";
        setPayMode(detectedMode);
        setAmounts({
          esp: trans.Enc_Esp ? trans.Enc_Esp.toString() : "",
          chq: trans.Enc_Chq ? trans.Enc_Chq.toString() : "",
          cb: trans.Enc_CB ? trans.Enc_CB.toString() : "",
        });
        // Si c'est un mode simple, on synchronise quand même 'amounts' avec le total actuel
        // comme ça si l'utilisateur bascule en Multi, il voit les bonnes valeurs.
        if (detectedMode !== "Multi") {
          setAmounts({
            esp: detectedMode === "Esp" ? trans.Total : 0,
            chq: detectedMode === "Chq" ? trans.Total : 0,
            cb: detectedMode === "CB" ? trans.Total : 0,
          });
        }
        // 4. Set EDIT MODE
        setEditingTransactionId(id);
        setActiveTab("COIFFURE");
        alert(
          " ✅ Mode édition activé. Modifiez le panier et re-validez le Paiement.",
        );
      }
    };
    // Plus de mot de passe pour éditer (simplification demandée)
    performEdit();
  };

  const addToCart = (item) => {
    setCart((prev) => [...prev, item]);
  };
  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    setCartPriceOverrides((prev) => {
      const next = {};
      Object.keys(prev || {}).forEach((k) => {
        const i = parseInt(k, 10);
        if (!Number.isFinite(i)) return;
        if (i < index) next[i] = prev[i];
        else if (i > index) next[i - 1] = prev[i];
      });
      return next;
    });
  };
  const toggleFavorite = (e, item) => {
    e.stopPropagation(); // prevent adding to cart
    const ctxKey = getFavoriteContextKeyForItem(item);
    setFavorites((prev) => {
      if (Array.isArray(prev)) {
        if (prev.includes(item)) return prev.filter((f) => f !== item);
        return [...prev, item];
      }
      const next = { ...(prev || {}) };
      const list = Array.isArray(next[ctxKey]) ? [...next[ctxKey]] : [];
      if (list.includes(item)) next[ctxKey] = list.filter((f) => f !== item);
      else next[ctxKey] = [...list, item];
      return next;
    });
  };
  const handlePayment = async () => {
    // --- VALIDATION ENCAISSEMENT ---
    if (!payMode)
      return alert(
        "❌Veuillez sélectionner le moyen de Paiement (CB, Espèces, Chèque...) !",
      );
    // ... (rest of the code remains the same)
    if (selectedCashiers.length === 0)
      return alert(
        "❌Veuillez sélectionner au moins une personne (qui a participé à la prestation) avant de valider l'encaissement.",
      );
    if (!client.nom)
      return alert(
        "❌Veuillez sélectionner ou créer un client pour encaisser !",
      );
    if ((parseFloat(retraitAmount) || 0) > 0 && !retraitCategory)
      return alert(
        "❌Veuillez choisir COIFFURE ou ESTHÉTIQUE pour appliquer la réduction !",
      );

    let shouldSkipCreation = false;
    if (isAddingNewClient) {
      if (!client.nom || !client.prenom || !client.num)
        return alert(
          "❌Nom, Prénom et numéro de téléphone sont obligatoires pour un nouveau client !",
        );

      // Vérification doublon Nom + Prénom + Num (Identification robuste)
      const cleanClientNum = (client.num || "").replace(/\D/g, "");
      const existing = clients.find(c =>
        (c.nom || "").toLowerCase().trim() === client.nom.toLowerCase().trim() &&
        (c.prenom || "").toLowerCase().trim() === client.prenom.toLowerCase().trim() &&
        (c.num || "").replace(/\D/g, "") === cleanClientNum
      );

      if (existing) {
        if (window.confirm(`⚠️ Le client "${existing.nom} ${existing.prenom}" est déjà enregistré dans votre fichier.\n\nSouhaitez-vous utiliser ce compte client existant pour cet encaissement ?`)) {
          setClient(existing);
          setIsAddingNewClient(false);
          shouldSkipCreation = true;
          // Temporairement pour la suite de la fonction
          client.nom = existing.nom;
          client.prenom = existing.prenom;
          client.num = existing.num;
        } else {
          return;
        }
      }
      // Vérification format téléphone (9 ou 10 chiffres, espaces automatiques ignorés)
      const cleanNum = client.num.replace(/\D/g, "");
      if (cleanNum.length !== 10 && cleanNum.length !== 9)
        return alert(
          "❌Le numéro de téléphone doit comporter 10 chiffres (ou 9 sans le 0) !",
        );
    }
    if (isAddingNewClient && !shouldSkipCreation && client.nom && !isSelectingClient) {
      const newClient = {
        id: Date.now(),
        nom: client.nom,
        prenom: client.prenom,
        num: client.num,
        visites: 0,
        notesTechniques: technicalNote.trim()
          ? [{ date: selectedDay, note: technicalNote }]
          : [],
      };
      setClients((prev) => [...prev, newClient]);
      setIsAddingNewClient(false);
    } else if (client.nom) {
      // Si on a un client (existant ou qu'on vient de sélectionner)
      if (technicalNote.trim()) {
        setClients((prev) =>
          prev.map((c) =>
            (client.id ? c.id === client.id : (c.nom === client.nom && c.prenom === client.prenom))
              ? {
                ...c,
                notesTechniques: [
                  { date: selectedDay, note: technicalNote },
                  ...(c.notesTechniques || []),
                ],
              }
              : c
          )
        );
      }
    }
    let finalEsp = 0,
      finalChq = 0,
      finalCb = 0;
    // --- EXTRACT FORCED PAYMENTS (DIVERS) ---
    let diverted = { esp: 0, chq: 0, cb: 0 };
    cart.forEach((name, idx) => {
      if (name.startsWith("DIVERS - ") || name.startsWith("CARTE CADEAU - ")) {
        const override = cartPriceOverrides?.[idx];
        const parts = name.split(" - ");
        const pStr = parts.find((p) => p.includes("€"))?.replace("€", "");
        const baseP = parseFloat(pStr) || 0;
        const p =
          override !== undefined && override !== null && override !== ""
            ? parseFloat(override) || 0
            : baseP;
        if (name.startsWith("DIVERS - ") && parts.length >= 4) {
          const m = parts[3].toLowerCase();
          if (m === "esp") diverted.esp += p;
          else if (m === "chq") diverted.chq += p;
          else if (m === "cb") diverted.cb += p;
        }
      }
    });
    const standardTotal = Math.max(
      0,
      netToPay - (diverted.esp + diverted.chq + diverted.cb),
    );
    // --- CALCUL VENTILATION ---
    const ventil = {
      C: 0,
      B: 0,
      S: 0,
      M: 0,
      Col: 0,
      P: 0,
      Esthetique_Val: 0,
      Vente_Val: 0,
    };
    let totalTheorique = 0;
    cart.forEach((name, idx) => {
      let p = 0;
      let cat = "Vente";
      const override = cartPriceOverrides?.[idx];
      const n = name.toLowerCase();
      if (override !== undefined && override !== null && override !== "") {
        p = parseFloat(override) || 0;
        if (name.startsWith("CARTE CADEAU - ") || name.startsWith("DIVERS - "))
          cat = "DIVERS";
        else cat = catalog[name]?.filtre || "Vente";
      } else if (
        name.startsWith("CARTE CADEAU - ") ||
        name.startsWith("DIVERS - ")
      ) {
        const parts = name.split(" - ");
        const priceStr = parts.find((p) => p.includes("€"))?.replace("€", "");
        p = parseFloat(priceStr) || 0;
        cat = "DIVERS";
      } else {
        const item = catalog[name];
        if (item) {
          p = item.prixVente;
          cat = item.filtre;
        }
      }
      if (p >= 0) {
        totalTheorique += p;
        if (cat === "DIVERS" || n.startsWith("divers - ") || availableFilters.VENTE.includes(cat))
          ventil.Vente_Val += p;
        else if (availableFilters.ESTHETIQUE.includes(cat))
          ventil.Esthetique_Val += p;
        else if (
          ["coloration", "tie", "décoloration", "pastel"].some((x) =>
            n.includes(x),
          )
        )
          ventil.Col += p;
        else if (["mèches", "balayage"].some((x) => n.includes(x)))
          ventil.M += p;
        else if (n.includes("coupe")) ventil.C += p;
        else if (
          ["shampooing", "coiffage", "fixateur"].some((x) => n.includes(x))
        )
          ventil.B += p;
        else ventil.P += p;
      }
    });
    if (totalTheorique > 0 && netToPay !== totalTheorique) {
      const diff = totalTheorique - netToPay;
      // On applique le retrait sur la Catégorie choisie dans la ventilation
      if (retraitCategory === "COIFFURE") {
        // Liste des clés coiffure dans ventil : C, B, S, M, Col, P
        const coiffCles = ["C", "B", "S", "M", "Col", "P"];
        const totalCoiff = coiffCles.reduce((sum, k) => sum + ventil[k], 0);
        if (totalCoiff > 0) {
          coiffCles.forEach(k => {
            ventil[k] = Math.max(0, ventil[k] - (ventil[k] / totalCoiff) * diff);
          });
        }
      } else {
        ventil.Esthetique_Val = Math.max(0, ventil.Esthetique_Val - diff);
      }
    }
    // Fin calcul ventil
    if (payMode === "Multi") {
      finalEsp = (parseFloat(amounts.esp) || 0) + diverted.esp;
      finalChq = (parseFloat(amounts.chq) || 0) + diverted.chq;
      finalCb = (parseFloat(amounts.cb) || 0) + diverted.cb;
      // --- AJUSTEMENT INTELLIGENT PAR CATÉGORIE (Demande User) ---
      const diff = netToPay - (finalEsp + finalChq + finalCb);
      const isEditing = !!editingTransactionId;
      const origTrans = isEditing
        ? history.find((h) => h.id === editingTransactionId)
        : null;
      if (Math.abs(diff) > 0.01) {
        if (origTrans) {
          // Si la transaction d'origine était monolithique (un seul mode >0.01€,
          // on applique tout le diff sur ce mode par défaut.
          const isMonolithic =
            [
              origTrans.Enc_Esp > 0.01,
              origTrans.Enc_Chq > 0.01,
              origTrans.Enc_CB > 0.01,
            ].filter(Boolean).length === 1;
          if (isMonolithic) {
            if (origTrans.Enc_Esp > 0.01) finalEsp += diff;
            else if (origTrans.Enc_Chq > 0.01) finalChq += diff;
            else finalCb += diff;
          } else {
            // On compare la ventilation pour savoir quelle Catégorie a changé
            const origCoiff =
              (origTrans.C || 0) +
              (origTrans.B || 0) +
              (origTrans.S || 0) +
              (origTrans.M || 0) +
              (origTrans.Col || 0) +
              (origTrans.P || 0);
            const currCoiff =
              ventil.C + ventil.B + ventil.S + ventil.M + ventil.Col + ventil.P;
            const diffCoiff = currCoiff - origCoiff;
            const diffEsth =
              ventil.Esthetique_Val - (origTrans.Esthetique_Val || 0);
            const diffVente = ventil.Vente_Val - (origTrans.Vente_Val || 0);
            // On applique les deltas sur les modes correspondants (Heuristique basée sur l'usage)
            // Si Coiffure change -> on ajuste la CB en priorité (si existante) ou l'Espèce
            if (Math.abs(diffCoiff) > 0.01) {
              if (origTrans.Enc_CB > 0.01) finalCb += diffCoiff;
              else finalEsp += diffCoiff;
            }
            // Si Esthétique change -> on ajuste l'Espèce en priorité (si existante) ou la CB
            if (Math.abs(diffEsth) > 0.01) {
              if (origTrans.Enc_Esp > 0.01) finalEsp += diffEsth;
              else finalCb += diffEsth;
            }
            // Si Vente change -> Espèces
            if (Math.abs(diffVente) > 0.01) finalEsp += diffVente;
            // Sécurité finale : si après ces ajustements par Catégorie il reste un micro-écart (arrondi)
            const finalDiff = netToPay - (finalEsp + finalChq + finalCb);
            if (Math.abs(finalDiff) > 0.01) finalCb += finalDiff;
          }
        } else {
          // Hors mode édition, on ajuste sur le mode déjà utilisé ou CB
          if (finalCb > 0.01 || (finalEsp <= 0.01 && finalChq <= 0.01))
            finalCb += diff;
          else if (finalEsp > 0.01) finalEsp += diff;
          else finalChq += diff;
        }
      }
    } else {
      finalCb = (payMode === "CB" ? standardTotal : 0) + diverted.cb;
      finalEsp = (payMode === "Esp" ? standardTotal : 0) + diverted.esp;
      finalChq = (payMode === "Chq" ? standardTotal : 0) + diverted.chq;
    }
    // --- GARANTIE COHÉRENCE FINALE (Paiement total == Net à payer) ---
    // On s'assure que la somme des Paiements est STRICTEMENT égale au netToPay
    // même après le bloc Multi ou Standard.
    const currentTotalPay = finalEsp + finalChq + finalCb;
    const missing = netToPay - currentTotalPay;
    if (Math.abs(missing) > 0.01) {
      if (payMode === "Chq" || finalChq > 0.01) finalChq += missing;
      else if (payMode === "Esp" || finalEsp > 0.01) finalEsp += missing;
      else finalCb += missing; // Mode CB ou Multi ou par défaut
    }
    // SÉCURITÉ : Pas de valeurs négatives
    finalEsp = Math.max(0, finalEsp);
    finalChq = Math.max(0, finalChq);
    finalCb = Math.max(0, finalCb);
    // CATEGORISATION VENTE PAR MARQUE
    let transactionCategory = "Coiffure";
    if (activeTab === "ESTHÉTIQUE") transactionCategory = "Esthetique";
    else if (activeTab === "VENTE") {
      // Find all unique brands in the cart
      const brandSet = new Set(
        cart.map((name) => catalog[name]?.filtre || "Divers"),
      );
      // If only one brand, use it as category (e.g. "UNIQ ONE", "YBERA")
      if (brandSet.size === 1) transactionCategory = [...brandSet][0];
      else transactionCategory = "Vente (Mixte)";
    }
    // ID : Si on édite, on garde le même ID. Sinon nouveau.
    const transactionId = editingTransactionId || Date.now();

    // Fonction helper pour s'assurer du format DD/MM/YYYY
    const ensureDDMMYYYY = (d) => {
      if (!d || typeof d !== "string") return "";
      if (d.includes("/")) return d; // Déjà au bon format
      if (d.includes("-")) {
        const parts = d.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return d;
    };

    // Utilisation de la date sélectionnée (selectedDay) au lieu de la date du système
    const transactionDate = ensureDDMMYYYY(editingTransactionId
      ? allTransactions.find((h) => h.id === editingTransactionId)?.Date || selectedDay
      : selectedDay);

    // Capture de l'heure actuelle
    const transactionHour = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    // Prix par ligne (pour que le ticket modifié soit reflété dans Excel/aperçus)
    const baseLinePrices = (cart || []).map((name, idx) => {
      const override = cartPriceOverrides?.[idx];
      if (override !== undefined && override !== null && override !== "") {
        return parseFloat(override) || 0;
      }
      if (name.startsWith("CARTE CADEAU - ") || name.startsWith("DIVERS - ")) {
        const parts = name.split(" - ");
        const priceStr = parts.find((p) => p && p.includes("€"))?.replace("€", "");
        return parseFloat(priceStr) || 0;
      }
      return Number(catalog[name]?.prixVente) || 0;
    });
    // Distribution du retrait sur les lignes de la Catégorie choisie
    const amtToDeduct = parseFloat(retraitAmount) || 0;
    let finalLinePrices = [...baseLinePrices];
    if (amtToDeduct > 0.009) {
      const targetIndices = [];
      let targetTotal = 0;
      cart.forEach((name, idx) => {
        const item = catalog[name];
        let cat = item?.filtre || "";
        if (name.startsWith("DIVERS - ") || name.startsWith("CARTE CADEAU - ")) {
          cat = "DIVERS";
        }
        const isEsth = availableFilters.ESTHETIQUE.includes(cat);
        const isCoiff = !isEsth && !availableFilters.VENTE.includes(cat) && cat !== "DIVERS";
        if ((retraitCategory === "COIFFURE" && isCoiff) || (retraitCategory === "ESTHÉTIQUE" && isEsth)) {
          targetIndices.push(idx);
          targetTotal += baseLinePrices[idx];
        }
      });
      if (targetTotal > 0) {
        targetIndices.forEach(idx => {
          const ratio = baseLinePrices[idx] / targetTotal;
          finalLinePrices[idx] = Math.max(0, baseLinePrices[idx] - amtToDeduct * ratio);
        });
      }
    }
    // Appliquer la carte cadeau (si utilisée) sur les lignes, pour que la somme == Total
    let giftToApply = parseFloat(cadeau) || 0;
    if (giftToApply > 0.01) {
      for (let i = 0; i < finalLinePrices.length && giftToApply > 0.01; i++) {
        const cur = finalLinePrices[i] || 0;
        if (cur <= 0) continue;
        const applied = Math.min(cur, giftToApply);
        finalLinePrices[i] = cur - applied;
        giftToApply -= applied;
      }
    }
    finalLinePrices = finalLinePrices.map((p) =>
      Math.round((Number(p) || 0) * 100) / 100,
    );
    const transaction = {
      id: transactionId,
      Date: transactionDate,
      Heure: transactionHour,
      Catégorie: transactionCategory,
      Nom_Client: `${(client.nom || "").trim()} ${(client.prenom || "").trim()}`.toUpperCase().trim() || "Passant",
      Numero_Client: client.num,
      Détails: cart.join(", "),
      Total: netToPay,
      Enc_Esp: finalEsp,
      Enc_Chq: finalChq,
      Enc_CB: finalCb,
      Enc_Cadeau: parseFloat(cadeau) || 0,
      Remise: 0, // Désormais remplacé par Retrait
      Retrait_Montant: parseFloat(retraitAmount) || 0,
      Retrait_Catégorie: retraitCategory,
      caissiere: selectedCashiers.join(" & "),
      caissieres: selectedCashiers,
      items_names: cart,
      items_prices: finalLinePrices,
      items_staff: cart.map((_, i) => cartStaff[i] || (selectedCashiers.length === 1 ? selectedCashiers[0] : null)),
    };
    if (transaction.Catégorie === "Vente") ventil.Vente_Val = netToPay;
    if (transaction.Catégorie === "Esthetique" && cart.length === 0)
      ventil.Esthetique_Val = netToPay;
    if (editingTransactionId) {
      // UPDATE MODE
      const transDateISO = normalizeDateToISO(transaction.Date);
      const transMonth = transDateISO.slice(0, 7);
      const now = new Date();
      const systemMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      if (transMonth === systemMonth) {
        setHistory((prev) =>
          prev.map((h) =>
            h.id === editingTransactionId ? { ...transaction, ...ventil } : h,
          ),
        );
      } else {
        setArchives((prev) => {
          if (!prev[transMonth]) return prev;
          return {
            ...prev,
            [transMonth]: prev[transMonth].map((h) =>
              h.id === editingTransactionId ? { ...transaction, ...ventil } : h,
            ),
          };
        });
      }
      alert(" ✅ Transaction modifiée avec succès !");
      setEditingTransactionId(null);
    } else {
      // CREATE MODE
      const transDateISO = normalizeDateToISO(transaction.Date);
      const transMonth = transDateISO.slice(0, 7);
      const now = new Date();
      const systemMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      if (transMonth === systemMonth) {
        setHistory((prev) => [...(prev || []), { ...transaction, ...ventil }]);
      } else {
        setArchives((prev) => {
          const m = prev[transMonth] || [];
          return {
            ...prev,
            [transMonth]: [...m, { ...transaction, ...ventil }]
          };
        });
      }
      // Gestion Fidélité & Sauvegarde Client (UNIQUEMENT SI NOUVELLE TRANSACTION)
      setClients((prevClients) => {
        let updatedClients = [...prevClients];
        const clientIndex = updatedClients.findIndex(c => {
          if (client.id) return c.id === client.id;
          const cNum = (c.num || "").replace(/\D/g, "");
          const clNum = (client.num || "").replace(/\D/g, "");
          return (c.nom || "").toLowerCase().trim() === client.nom.toLowerCase().trim() &&
            (c.prenom || "").toLowerCase().trim() === client.prenom.toLowerCase().trim() &&
            cNum === clNum;
        });

        if (clientIndex !== -1) {
          // Client existant : +1 visite
          const existingNotes = updatedClients[clientIndex].notesTechniques || [];
          const newNotes = technicalNote.trim()
            ? [
              { date: transactionDate, note: technicalNote.trim() },
              ...existingNotes,
            ].slice(0, 50)
            : existingNotes;

          // --- Détection Coiffure / Esthétique dans le panier ---
          const COIFFURE_FILTRES = ["HOMME", "JUNIOR", "DAME COURTS", "DAME LONGS", "TECHNIQUE COURTS", "TECHNIQUE LONGS", "TECHNIQUE SEULE", "SOINS", "TECHNIQUE HOMME"];
          let hasCoiffure = false;
          let hasEsthetique = false;
          (cart || []).forEach(itemName => {
            const catItem = catalog?.[itemName];
            if (catItem && !catItem.type && catItem.filtre) {
              // C'est un service (pas un produit retail/technique)
              if (COIFFURE_FILTRES.includes(catItem.filtre)) {
                hasCoiffure = true;
              } else {
                hasEsthetique = true;
              }
            }
          });
          // Si aucun service détecté dans le panier, on considère coiffure par défaut
          if (!hasCoiffure && !hasEsthetique) hasCoiffure = true;

          updatedClients[clientIndex] = {
            ...updatedClients[clientIndex],
            visites: (updatedClients[clientIndex].visites || 0) + 1,
            visitesCoiffure: (updatedClients[clientIndex].visitesCoiffure || 0) + (hasCoiffure ? 1 : 0),
            visitesEsthetique: (updatedClients[clientIndex].visitesEsthetique || 0) + (hasEsthetique ? 1 : 0),
            num: client.num || updatedClients[clientIndex].num, // Update tel if provided
            notesTechniques: newNotes,
          };
        } else if (client.nom.trim() && client.prenom.trim()) {
          // Nouveau client : 1ere visite — même détection
          const COIFFURE_FILTRES = ["HOMME", "JUNIOR", "DAME COURTS", "DAME LONGS", "TECHNIQUE COURTS", "TECHNIQUE LONGS", "TECHNIQUE SEULE", "SOINS", "TECHNIQUE HOMME"];
          let hasCoiffure = false;
          let hasEsthetique = false;
          (cart || []).forEach(itemName => {
            const catItem = catalog?.[itemName];
            if (catItem && !catItem.type && catItem.filtre) {
              if (COIFFURE_FILTRES.includes(catItem.filtre)) {
                hasCoiffure = true;
              } else {
                hasEsthetique = true;
              }
            }
          });
          if (!hasCoiffure && !hasEsthetique) hasCoiffure = true;

          updatedClients.push({
            id: Date.now(),
            nom: client.nom.toUpperCase().trim(),
            prenom: client.prenom.trim(),
            num: client.num,
            visites: 1,
            visitesCoiffure: hasCoiffure ? 1 : 0,
            visitesEsthetique: hasEsthetique ? 1 : 0,
            notesTechniques: technicalNote.trim()
              ? [{ date: transactionDate, note: technicalNote.trim() }]
              : [],
          });
        }
        return updatedClients;
      });
      setTechnicalNote(""); // Reset après sauvegarde
      alert("Encaissement validé !");
    }
    // Déduction Stock (Indépendant de l'onglet actif)
    setInventory((prevInv) => {
      let updatedInv = { ...prevInv };
      let invChanged = false;
      cart.forEach((itemName) => {
        const catItem = catalog[itemName];
        if (catItem) {
          const typeKey = (catItem.type === "technical") ? "technique" : "vente";
          const tabsToCheck = (catItem.type === "both") ? ["vente", "technique"] : [typeKey];

          tabsToCheck.forEach(tab => {
            const idx = updatedInv[tab].findIndex((i) => i.nom === itemName);
            if (idx !== -1) {
              invChanged = true;
              updatedInv[tab][idx] = {
                ...updatedInv[tab][idx],
                quantite: Math.max(0, updatedInv[tab][idx].quantite - 1),
                cumulSorties: (updatedInv[tab][idx].cumulSorties || 0) + 1
              };
            } else if (catItem.type !== "both") {
              // Uniquement si c'est un type spécifique non trouvé, on l'ajoute
              invChanged = true;
              updatedInv[tab].push({
                id: Date.now() + Math.random(),
                nom: itemName,
                prix: catItem.prixVente,
                quantite: 0,
                cumulEntrees: 0,
                cumulSorties: 1,
                type: catItem.type,
              });
            }
          });
        }
      });
      return invChanged ? updatedInv : prevInv;
    });
    setCart([]);
    setCartPriceOverrides({});
    setClient({ nom: "", prenom: "", num: "" });
    setRemise(0);
    setRetraitAmount(0);
    setRetraitCategory("");
    setCadeau(0);
    setAmounts({ esp: 0, chq: 0, cb: 0 });
    setPayMode(null);
    setSelectedCashiers([]); // RESET CAISSI ^RES APR ^S ENCAISSEMENT
    setCartStaff({});
    setIsSelectingClient(false);
    setIsAddingNewClient(false);
  };
  const exportToExcel = (data, filename) => {
    if (data.length === 0) {
      alert("Aucune transaction trouvée.");
      return;
    }
    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
    const format2 = (n) => round2(n).toFixed(2);
    // 1. Format Data for Excel (Clean Table)
    const formattedData = data.map((d) => {
      // Determine Payment Mode
      let mode = "Autre";
      if (d.Enc_CB > 0) mode = "CB";
      else if (d.Enc_Esp > 0) mode = "Espèces";
      else if (d.Enc_Chq > 0) mode = "Chèque";
      // Multi-payment check
      const modes = [];
      if (d.Enc_CB > 0) modes.push(`CB (${format2(d.Enc_CB)}€)`);
      if (d.Enc_Esp > 0) modes.push(`Esp (${format2(d.Enc_Esp)}€)`);
      if (d.Enc_Chq > 0) modes.push(`Chq (${format2(d.Enc_Chq)}€)`);
      if (modes.length > 1) mode = modes.join(" + ");
      return {
        Date: d.Date,
        Client: d.Nom_Client || "Passant",
        Téléphone: d.Numero_Client || "",
        "Prestations / Produits": (d.Détails || "").replace(/[🛒🎨💅✨🧖‍♀️👁️💄🧴🎨]/g, "").replace(/\s+/g, " ").trim(),
        "Total (€)": round2(d.Total),
        "Moyen Paiement": mode,
        Remise: d.Remise ? `${d.Remise}%` : "",
        "Carte Cadeau": d.Enc_Cadeau > 0 ? `${format2(d.Enc_Cadeau)}€` : "",
      };
    });
    // 2. Convert JSON to Worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData);
    // Force 2-decimal format for the "Total (€)" numeric column
    try {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      const totalColIdx = 4; // Date(A) Client(B) Tel(C) Détails(D) Total(E)
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const addr = XLSX.utils.encode_cell({ r: R, c: totalColIdx });
        if (!ws[addr]) continue;
        const v = Number(ws[addr].v);
        if (Number.isFinite(v)) {
          ws[addr].v = round2(v);
          ws[addr].t = "n";
          ws[addr].z = "# ##0.00";
        }
      }
    } catch (e) {
      console.error("Excel formatting error:", e);
    }
    // Auto-width for columns
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 20 }, // Client
      { wch: 15 }, // Tel
      { wch: 40 }, // Détails
      { wch: 10 }, // Total
      { wch: 20 }, // Paiement
      { wch: 10 }, // Remise
      { wch: 10 }, // Cadeau
    ];
    ws["!cols"] = colWidths;
    // 3. Create Workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    // 4. Write file (triggers download)
    const realFilename = filename.replace(".xls", ".xlsx");
    let subfolder = "Rapports Divers";
    let reportDate = "";
    if (realFilename.includes("Journalier")) {
      subfolder = "Rapport Journalier";
      reportDate = selectedDay || new Date().toISOString().slice(0, 10);
    } else if (realFilename.includes("Mensuel")) {
      subfolder = "Rapport Mensuel Compta";
      reportDate = selectedMonth || new Date().toISOString().slice(0, 7);
    }
    saveExcelToFolder(wb, realFilename, subfolder, reportDate);
  };
  const exportToExcelAOA = (aoa, filename) => {
    if (!aoa || aoa.length === 0) return alert("❌Aucune donnée à exporter.");
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Auto-width using improved logic
    ws["!cols"] = calcAutoWidth(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rapport");
    saveExcelToFolder(wb, filename, "Inventaires", new Date().toISOString().slice(0, 10));
  };
  // Helper for borders and premium grayscale styling (ink-save)
  const applyStyles = (ws, headerRows = 1) => {
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const firstCellAddr = XLSX.utils.encode_cell({ r: R, c: range.s.c });
      const firstCellVal = ws[firstCellAddr]?.v || "";
      const isTotalRow =
        typeof firstCellVal === "string" &&
        firstCellVal.toLowerCase().includes("total");
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        // Borders (Thin black for clean look)
        ws[cellAddress].s.border = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        };
        ws[cellAddress].s.alignment = {
          vertical: "center",
          horizontal: "center",
          wrapText: true,
        };
        // Grayscale Palette (Ink-save)
        if (R < headerRows) {
          ws[cellAddress].s.fill = { fgColor: { rgb: "D9D9D9" } }; // Medium Gray
          ws[cellAddress].s.font = { color: { rgb: "000000" }, bold: true };
        } else if (isTotalRow) {
          ws[cellAddress].s.fill = { fgColor: { rgb: "F2F2F2" } }; // Light Gray
          ws[cellAddress].s.font = { bold: true };
        }
      }
    }
  };
  const calcAutoWidth = (aoa) => {
    if (!aoa || aoa.length === 0) return [];
    try {
      const maxCols = Math.max(...aoa.map((row) => (row ? row.length : 0)));
      const widths = Array(maxCols).fill(10); // Minimum 10
      aoa.forEach((row) => {
        if (!row) return;
        row.forEach((cell, cIdx) => {
          if (cell === null || cell === undefined) return;
          let val = "";
          if (typeof cell === "object" && cell.z) {
            // Pour les cellules avec format (ex: # ##0"€  (Détails)"),
            // on extrait le texte littéral entre guillemets pour le calcul de largeur
            const formatStr = String(cell.z);
            const matches = formatStr.match(/"([^"]+)"/g);
            if (matches) {
              const literalText = matches
                .map((m) => m.replace(/"/g, ""))
                .join("");
              val = String(cell.v || "") + literalText;
            } else {
              val = String(cell.v || "");
            }
          } else {
            val = String(cell.v !== undefined ? cell.v : cell);
          }
          const len = val.length + 5; // Marge de sécurité généreuse
          if (len > widths[cIdx]) widths[cIdx] = len;
        });
      });
      // Suppression de la limite (cap) pour éviter les hashtags
      return widths.map((w) => ({ wch: w }));
    } catch (e) {
      console.error("Error calculating widths:", e);
      return [];
    }
  };
  const getAllTransactions = useCallback(() => {
    let all = [...(history || [])];

    // Ajout des archives
    Object.keys(archives || {}).forEach((monthKey) => {
      if (archives[monthKey]) {
        all = [...all, ...archives[monthKey]];
      }
    });

    // Déduplication de sécurité par ID
    const unique = [];
    const seen = new Set();
    all.forEach(t => {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    });
    return unique;
  }, [history, archives]);

  const saveExcelToFolder = async (wb, filename, subfolderName = "", reportDate = "") => {
    try {
      if (!reportsFolderHandle) {
        console.log("📁 Pas de dossier configuré, téléchargement standard.");
        XLSX.writeFile(wb, filename);
        return false;
      }

      // Vérifier/Demander la permission
      const options = { mode: "readwrite" };
      let permission = await reportsFolderHandle.queryPermission(options);
      if (permission !== "granted") {
        permission = await reportsFolderHandle.requestPermission(options);
      }

      if (permission === "granted") {
        let targetDir = reportsFolderHandle;

        // 1. Dossier du mois (si une date est fournie)
        if (reportDate) {
          const parts = reportDate.split("-");
          if (parts.length >= 2) {
            const year = parts[0];
            const monthIndex = parseInt(parts[1], 10) - 1;
            const filterMonths = [
              "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
              "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
            ];
            if (monthIndex >= 0 && monthIndex <= 11) {
              const monthName = filterMonths[monthIndex];
              const monthFolderName = `${monthName} ${year}`;
              targetDir = await targetDir.getDirectoryHandle(monthFolderName, { create: true });
            }
          }
        }

        // 2. Sous-dossier du type de rapport
        if (subfolderName) {
          targetDir = await targetDir.getDirectoryHandle(subfolderName, { create: true });
        }

        const fileH = await targetDir.getFileHandle(filename, { create: true });
        const writable = await fileH.createWritable();

        // Conversion de XLSX object array buffer
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        await writable.write(blob);
        await writable.close();

        console.log(`✅ Fichier ${filename} enregistré dans ${subfolderName || 'racine'}`);
        return true;
      } else {
        alert("⚠️ Permission refusée par le navigateur pour enregistrer dans le dossier.");
      }
    } catch (err) {
      console.error("❌ Erreur lors de l'enregistrement automatique:", err);
      alert("❌ Une erreur est survenue lors de l'accès au dossier : " + err.message);
    }

    // Fallback: Téléchargement standard si erreur
    console.log("⚠️ Fallback activé: Téléchargement standard.");
    XLSX.writeFile(wb, filename);
    return false;
  };

  const exportDailyExcel = () => {
    const dayData = getAllTransactions().filter((h) => normalizeDateToISO(h.Date) === selectedDay);
    exportToExcel(dayData, `Export_Journalier_${selectedDay}.xls`);
  };
  const exportMonthlyExcel = () => {
    const monthData = getAllTransactions().filter(
      (h) =>
        h &&
        h.Date &&
        typeof h.Date === "string" &&
        normalizeDate(h.Date).startsWith(selectedMonth),
    );
    exportToExcel(monthData, `Export_Mensuel_${selectedMonth}.xls`);
  };
  const getWeeklyRecap = () => {
    const monthData = getAllTransactions().filter(
      (h) =>
        h &&
        h.Date &&
        typeof h.Date === "string" &&
        normalizeDate(h.Date).startsWith(selectedMonth),
    );
    const weeks = [
      {
        name: "Semaine 1",
        total: 0,
        uniqueClients: new Set(),
        stock: 0,
        transactions: [],
        cashiers: {},
      },
      {
        name: "Semaine 2",
        total: 0,
        uniqueClients: new Set(),
        stock: 0,
        transactions: [],
        cashiers: {},
      },
      {
        name: "Semaine 3",
        total: 0,
        uniqueClients: new Set(),
        stock: 0,
        transactions: [],
        cashiers: {},
      },
      {
        name: "Semaine 4",
        total: 0,
        uniqueClients: new Set(),
        stock: 0,
        transactions: [],
        cashiers: {},
      },
      {
        name: "Semaine 5",
        total: 0,
        uniqueClients: new Set(),
        stock: 0,
        transactions: [],
        cashiers: {},
      },
    ];
    monthData.forEach((h) => {
      try {
        // Extraction robuste du jour quel que soit le format (DD/MM/YYYY ou YYYY-MM-DD)
        let day = 1;
        if (h.Date.includes("/")) {
          day = parseInt(h.Date.split("/")[0]);
        } else if (h.Date.includes("-")) {
          day = parseInt(h.Date.split("-")[2]);
        }

        let weekIdx = 0;
        if (day <= 7) weekIdx = 0;
        else if (day <= 14) weekIdx = 1;
        else if (day <= 21) weekIdx = 2;
        else if (day <= 28) weekIdx = 3;
        else weekIdx = 4;
        weeks[weekIdx].total += Number(h.Total) || 0;
        // Unique Clients: Combine Name + Num as key
        const clientKey = `${h.Nom_Client || "PASSANT"}_${h.Numero_Client || "NONE"}`;
        weeks[weekIdx].uniqueClients.add(clientKey);
        weeks[weekIdx].transactions.push(h);
        const cashierKey = h.caissiere || "(non renseigné)";
        weeks[weekIdx].cashiers[cashierKey] =
          (weeks[weekIdx].cashiers[cashierKey] || 0) + (Number(h.Total) || 0);
        // Ventes Stock (Retail items only)
        if (h.items_names) {
          h.items_names.forEach((name) => {
            if (catalog[name] && catalog[name].type === "retail") {
              weeks[weekIdx].stock += 1;
            }
          });
        }
      } catch {
        console.warn("Erreur calcul semaine pour ligne:", h);
      }
    });
    // Convert Set count to clients number
    weeks.forEach((w) => (w.clients = w.uniqueClients.size));
    return weeks;
  };
  const handlePrintMonthlyReport = (type) => {
    if (!selectedMonth) return alert("❌Veuillez sélectionner un mois.");
    const aoa = generateMonthlyReportAOA(type);
    const filename = `Rapport_Mensuel_${type}_${selectedMonth}.xlsx`;
    const merges = [
      { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } }, // PRESTATION COIFFURE
      { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } }, // VENTES
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Date
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Jour
      { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } }, // Total Presta
      { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } }, // Total ventes
      { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // Total général
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = merges;
    applyStyles(ws, 2);
    ws["!cols"] = calcAutoWidth(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fiche Mensuelle");

    saveExcelToFolder(wb, filename, type === "Perso" ? "Rapport Mensuel Perso" : "Rapport Mensuel Compta", selectedMonth);
    // Toast feedback
    const msg = document.createElement("div");
    msg.innerHTML = "✅ Excel Mensuel généré : " + type;
    msg.style.cssText =
      "position:fixed; bottom:20px; left:20px; background:#8e44ad; color:white; padding:10px 20px; borderRadius:10px; zIndex:20000; animation: fadeOut 3s forwards;";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };
  const handlePrintDailyReport = (type) => {
    if (!selectedDay) return alert("❌Veuillez sélectionner un jour.");
    const aoa = generateDailyReportAOA(type);
    const dateFormatted = selectedDay.split("-").reverse().join("_");
    const filename = `Rapport_Journalier_${type}_${dateFormatted}.xlsx`;
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    applyStyles(ws, 1);
    ws["!cols"] = calcAutoWidth(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fiche Journalière");

    saveExcelToFolder(wb, filename, "Rapport Journalier", selectedDay);
    // Feedback
    const msg = document.createElement("div");
    msg.innerHTML = "✅ Excel Journalier généré : " + type;
    msg.style.cssText =
      "position:fixed; bottom:20px; right:20px; background:#27ae60; color:white; padding:10px 20px; borderRadius:10px; zIndex:20000; animation: fadeOut 3s forwards;";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };
  const handlePreviewDaily = (type) => {
    if (!selectedDay) return alert("❌Veuillez sélectionner un jour.");
    const aoa = generateDailyReportAOA(type);
    setPreviewData(aoa);
    setPreviewTitle(`Rapport Journalier (${type}) - ${selectedDay}`);
    setShowPreviewModal(true);
  };
  const handlePreviewMonthly = (type) => {
    if (!selectedMonth) return alert("❌Veuillez sélectionner un mois.");
    const aoa = generateMonthlyReportAOA(type);
    setPreviewData(aoa);
    setPreviewTitle(`Rapport Mensuel (${type}) - ${selectedMonth}`);
    setShowPreviewModal(true);
  };
  // --- GENERATORS ---
  const generateDailyReportAOA = (type = "Perso") => {
    const dayTransactions = allTransactions.filter((h) => normalizeDateToISO(h.Date) === selectedDay);

    const isPerso = type === "Perso";
    const aoa = [
      [
        "Noms",
        "Coiffure",
        "Prix",
        "Esthétique",
        "Prix",
        "Vente",
        "Prix",
        "Esp",
        "Chq",
        "CB",
        "Total",
      ],
    ];
    let totalsCoiff = 0,
      totalsEsth = 0,
      totalsVente = 0,
      totalsEsp = 0,
      totalsChq = 0,
      totalsCb = 0,
      totalsGrand = 0;
    dayTransactions.forEach((t) => {
      const hasStoredPrices = Array.isArray(t.items_prices);
      let coiffNames = [],
        coiffPrix = [],
        esthNames = [],
        esthPrix = [],
        venteNames = [],
        ventePrix = [];
      (t.items_names || []).forEach((name, idx) => {
        let p = 0,
          cat = "";
        const storedP = hasStoredPrices ? Number(t.items_prices?.[idx]) : NaN;
        if (Number.isFinite(storedP)) {
          p = storedP;
          if (
            name.startsWith("CARTE CADEAU - ") ||
            name.startsWith("DIVERS - ")
          ) {
            cat = "DIVERS";
          } else {
            const item = catalog[name];
            cat = item?.filtre || "";
          }
        } else if (
          name.startsWith("CARTE CADEAU - ") ||
          name.startsWith("DIVERS - ")
        ) {
          const parts = name.split(" - ");
          const pStr = parts.find((p) => p.includes("€"))?.replace("€", "");
          p = parseFloat(pStr) || 0;
          cat = "DIVERS";
        } else {
          const item = catalog[name];
          if (item) {
            p = item.prixVente || 0;
            cat = item.filtre;
          }
        }
        if (p >= 0) {
          let shortName = name.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "").trim();
          if (name.startsWith("DIVERS - ")) {
            const parts = name.split(" - ");
            shortName =
              parts.length >= 3 && parts[1] !== "Divers" ? parts[1] : "Divers";
          } else if (name.startsWith("CARTE CADEAU - ")) {
            shortName = "Carte Cadeau";
          }
          const isDiversItem =
            cat === "DIVERS" ||
            name.startsWith("DIVERS - ") ||
            name.startsWith("CARTE CADEAU - ");
          if (availableFilters.ESTHETIQUE?.includes(cat)) {
            esthNames.push(shortName);
            esthPrix.push(p);
          } else if (
            availableFilters.VENTE?.includes(cat) ||
            cat === "DIVERS"
          ) {
            venteNames.push(isDiversItem ? shortName : "");
            ventePrix.push(p);
          } else {
            coiffNames.push(shortName);
            coiffPrix.push(p);
          }
        }
      });
      let giftDiscount = 0;
      (t.items_names || []).forEach((name, idx) => {
        if (name.startsWith("CARTE CADEAU - ")) {
          const storedP = hasStoredPrices ? Number(t.items_prices?.[idx]) : NaN;
          if (Number.isFinite(storedP) && storedP < 0) {
            giftDiscount += Math.abs(storedP);
          }
        }
      });

      const formatNames = (names) => {
        if (names.length === 0) return "";
        const hasDivers =
          names.includes("Divers") || names.includes("Carte Cadeau");
        if (hasDivers) {
          const others = names.filter(
            (n) => n !== "Divers" && n !== "Carte Cadeau",
          );
          return (
            (others.length > 0 ? others.join(", ") + " + " : "") +
            (names.includes("Divers") ? "Divers" : "Carte Cadeau")
          );
        }
        return names.join(", ");
      };
      const formatPrice = (prices, names, showDétail = true, isGrandTotal = false) => {
        const sum = prices.reduce((a, b) => a + b, 0) || 0;
        if (isPerso && showDétail) {
          const DétailParts = [];
          for (let i = 0; i < prices.length; i++) {
            const p = prices[i];
            const n = names[i];
            if (Math.abs(p) > 0.01 && n)
              DétailParts.push(`${p.toFixed(2)}€  ${n}`);
          }

          // Injecter l'info Carte Cadeau dans l'affichage si c'est le total ou s'il y en a une
          if (isGrandTotal && giftDiscount > 0) {
            const baseTotal = sum + giftDiscount;
            const DétailStr = `${baseTotal.toFixed(2)}€ - ${giftDiscount.toFixed(2)}€ CARTE CADEAU = ${sum.toFixed(2)}€`;
            return { v: sum, t: "n", z: `# ##0.00"€  (${DétailStr})"` };
          }

          let DétailStr = DétailParts.join(" + ").replace(/"/g, "'");
          if (DétailStr.length > 150)
            DétailStr = DétailStr.substring(0, 147) + "...";
          if (DétailStr) {
            return { v: sum, t: "n", z: `# ##0.00"€  (${DétailStr})"` };
          }
        }
        return { v: sum, t: "n", z: '# ##0.00"€ "' };
      };
      const targetTotal = t.Total || 0;
      // --- ROBUST SCALING (Always apply if mismatch > 0.01) ---
      let reconstructedTotal =
        coiffPrix.reduce((a, b) => a + b, 0) +
        esthPrix.reduce((a, b) => a + b, 0) +
        ventePrix.reduce((a, b) => a + b, 0);

      // On ignore la carte cadeau pour le scaling pour garder la cohérence
      if (Math.abs(targetTotal - reconstructedTotal) > 0.01) {
        if (reconstructedTotal > 0.01) {
          const ratio = targetTotal / reconstructedTotal;
          coiffPrix = coiffPrix.map((p) => p * ratio);
          esthPrix = esthPrix.map((p) => p * ratio);
          ventePrix = ventePrix.map((p) => p * ratio);
        } else if (targetTotal > 0.01) {
          if (coiffPrix.length > 0) coiffPrix[0] = targetTotal;
          else if (esthPrix.length > 0) esthPrix[0] = targetTotal;
          else if (ventePrix.length > 0) ventePrix[0] = targetTotal;
          else {
            if (t.Catégorie === "Coiffure") {
              coiffNames.push("Ajustement");
              coiffPrix = [targetTotal];
            } else if (t.Catégorie === "Esthetique") {
              esthNames.push("Ajustement");
              esthPrix = [targetTotal];
            } else {
              venteNames.push("Ajustement");
              ventePrix = [targetTotal];
            }
          }
        } else {
          coiffPrix = coiffPrix.map(() => 0);
          esthPrix = esthPrix.map(() => 0);
          ventePrix = ventePrix.map(() => 0);
        }
      }
      let payEsp = t.Enc_Esp || 0;
      let payChq = t.Enc_Chq || 0;
      let payCb = t.Enc_CB || 0;
      const curTotPay = payEsp + payChq + payCb;
      if (!hasStoredPrices && Math.abs(curTotPay - targetTotal) > 0.01) {
        if (curTotPay > 0.01) {
          const pRatio = targetTotal / curTotPay;
          payEsp *= pRatio;
          payChq *= pRatio;
          payCb *= pRatio;
        } else if (targetTotal > 0.01) {
          payCb = targetTotal;
        } else {
          payEsp = 0;
          payChq = 0;
          payCb = 0;
        }
      }
      const rowTotNamesListRaw = [
        ...new Set([...coiffNames, ...esthNames, ...venteNames]),
      ];
      const rowTotNamesList = rowTotNamesListRaw.filter(
        (n) =>
          n === "Divers" ||
          n === "Carte Cadeau" ||
          n.includes("Divers") ||
          n.includes("Carte"),
      );
      let rowTotStr =
        isPerso && rowTotNamesList.length > 0
          ? ` (dont ${rowTotNamesList.join(" + ")})`
          : "";
      rowTotStr = rowTotStr.replace(/"/g, "'");
      if (rowTotStr.length > 150)
        rowTotStr = rowTotStr.substring(0, 147) + "...";
      const rowNum = aoa.length + 1;
      const maxPay = Math.max(payEsp, payChq, payCb);
      aoa.push([
        t.Nom_Client || "Passant",
        formatNames(coiffNames),
        formatPrice(coiffPrix, coiffNames, false),
        formatNames(esthNames),
        formatPrice(esthPrix, esthNames, false),
        formatNames(venteNames),
        formatPrice(ventePrix, venteNames, true),
        maxPay === payEsp
          ? {
            f: `K${rowNum}-I${rowNum}-J${rowNum}`,
            v: payEsp,
            t: "n",
            z: '# ##0.00"€ "',
          }
          : formatPrice([payEsp], [], false),
        maxPay === payChq
          ? {
            f: `K${rowNum}-H${rowNum}-J${rowNum}`,
            v: payChq,
            t: "n",
            z: '# ##0.00"€ "',
          }
          : formatPrice([payChq], [], false),
        maxPay === payCb || maxPay === 0
          ? {
            f: `K${rowNum}-H${rowNum}-I${rowNum}`,
            v: payCb,
            t: "n",
            z: '# ##0.00"€ "',
          }
          : formatPrice([payCb], [], false),
        {
          f: `C${rowNum}+E${rowNum}+G${rowNum}`,
          v: targetTotal,
          t: "n",
          z: `# ##0.00"€ ${rowTotStr}"`,
        },
      ]);
      totalsCoiff += coiffPrix.reduce((a, b) => a + b, 0);
      totalsEsth += esthPrix.reduce((a, b) => a + b, 0);
      totalsVente += ventePrix.reduce((a, b) => a + b, 0);
      totalsEsp += payEsp;
      totalsChq += payChq;
      totalsCb += payCb;
      totalsGrand += targetTotal;
    });
    for (let i = dayTransactions.length; i < 20; i++) {
      const rowNum = aoa.length + 1;
      aoa.push([
        "",
        "",
        { v: 0, t: "n", z: '# ##0.00"€ "' },
        "",
        { v: 0, t: "n", z: '# ##0.00"€ "' },
        "",
        { v: 0, t: "n", z: '# ##0.00"€ "' },
        { v: 0, t: "n", z: '# ##0.00"€ "' },
        { v: 0, t: "n", z: '# ##0.00"€ "' },
        {
          f: `K${rowNum}-H${rowNum}-I${rowNum}`,
          v: 0,
          t: "n",
          z: '# ##0.00"€ "',
        },
        {
          f: `C${rowNum}+E${rowNum}+G${rowNum}`,
          v: 0,
          t: "n",
          z: '# ##0.00"€ "',
        },
      ]);
    }
    aoa.push([
      "TOTAL",
      "",
      { f: "SUM(C2:C21)", v: totalsCoiff, t: "n", z: '# ##0.00"€ "' },
      "",
      { f: "SUM(E2:E21)", v: totalsEsth, t: "n", z: '# ##0.00"€ "' },
      "",
      { f: "SUM(G2:G21)", v: totalsVente, t: "n", z: '# ##0.00"€ "' },
      { f: "SUM(H2:H21)", v: totalsEsp, t: "n", z: '# ##0.00"€ "' },
      { f: "SUM(I2:I21)", v: totalsChq, t: "n", z: '# ##0.00"€ "' },
      { f: "SUM(J2:J21)", v: totalsCb, t: "n", z: '# ##0.00"€ "' },
      { f: "SUM(K2:K21)", v: totalsGrand, t: "n", z: '# ##0.00"€ "' },
    ]);
    return aoa;
  };
  const generateMonthlyReportAOA = (type = "Comptabilité") => {
    const isPerso = type === "Perso";
    const [year, month] = selectedMonth.split("-");
    const numDays = new Date(year, month, 0).getDate();
    const FrenchDays = [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
    ];
    const aoa = [
      [
        "Date",
        "Jour",
        "PRESTATION COIFFURE/ESTHÉTIQUE",
        "",
        "",
        "Total Presta",
        "VENTES / DIVERS",
        "",
        "",
        "Total ventes",
        "Total général",
      ],
      [
        "",
        "",
        "Montant espèces",
        "Montant chèques",
        "Montant CB",
        "",
        "Montant espèces",
        "Montant chèques",
        "Montant CB",
        "",
        "",
      ],
    ];
    const monthData = allTransactions.filter(
      (h) => h && h.Date && normalizeDate(h.Date).startsWith(selectedMonth),
    );
    const initSums = () => ({
      cEsp: { s: 0, d: [], dSum: 0 },
      cChq: { s: 0, d: [], dSum: 0 },
      cCb: { s: 0, d: [], dSum: 0 },
      vEsp: { s: 0, d: [], dSum: 0 },
      vChq: { s: 0, d: [], dSum: 0 },
      vCb: { s: 0, d: [], dSum: 0 },
      rowTot: { s: 0, d: [], dSum: 0 },
      vEspNames: [],
      vChqNames: [],
      vCbNames: [],
      rowTotNames: [],
      actualTotal: 0,
      diversTotal: 0,
    });
    let grandTotal = initSums();
    const weekRanges = [
      { end: 7 },
      { end: 14 },
      { end: 21 },
      { end: 28 },
      { end: 31 },
    ];
    let weekIdx = 0;
    let weekTotal = initSums();
    let weekStartRow = 3;
    let weekRows = [];
    const formatCell = (val, names = []) => {
      const s = val.s || 0;
      const dTotal = val.dSum || 0;
      const totalVal = s + dTotal;
      if (isPerso) {
        let namesStr =
          names.length > 0 ? ` (dont ${[...new Set(names)].join(" + ")})` : "";
        namesStr = namesStr.replace(/"/g, "'");
        if (namesStr.length > 150)
          namesStr = namesStr.substring(0, 147) + "...";
        return { v: totalVal, t: "n", z: `# ##0.00"€ ${namesStr}"` };
      }
      return { v: totalVal, t: "n", z: '# ##0.00"€ "' };
    };
    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${year}-${month}-${day.toString().padStart(2, "0")}`;
      const dayTransactions = monthData.filter((t) => normalizeDate(t.Date) === dateStr);
      let daySums = initSums();
      dayTransactions.forEach((t) => {
        const totalNet = t.Total || 0;
        const hasStoredPrices = Array.isArray(t.items_prices);
        let tEncEsp = t.Enc_Esp || 0;
        let tEncChq = t.Enc_Chq || 0;
        let tEncCb = t.Enc_CB || 0;
        const tEncTotal = tEncEsp + tEncChq + tEncCb;
        if (Math.abs(tEncTotal - totalNet) > 0.01) {
          if (tEncTotal > 0.01) {
            const pRatio = totalNet / tEncTotal;
            tEncEsp *= pRatio;
            tEncChq *= pRatio;
            tEncCb *= pRatio;
          } else if (totalNet > 0.01) {
            tEncCb = totalNet;
          } else {
            tEncEsp = 0;
            tEncChq = 0;
            tEncCb = 0;
          }
        }
        let dValTheo = 0;
        let tDiversNames = [];
        let tDiversBreakdown = { esp: 0, chq: 0, cb: 0 };
        const theoTotal = (t.items_names || []).reduce((sum, name, idx) => {
          const storedP = hasStoredPrices ? Number(t.items_prices?.[idx]) : NaN;
          if (Number.isFinite(storedP)) return sum + storedP;
          let p = 0;
          if (
            name.startsWith("DIVERS - ") ||
            name.startsWith("CARTE CADEAU - ")
          ) {
            const parts = name.split(" - ");
            p =
              parseFloat(
                parts.find((x) => x.includes("€"))?.replace("€", ""),
              ) || 0;
          } else {
            p = catalog[name]?.prixVente || 0;
          }
          return sum + p;
        }, 0);
        // --- Robust Scaling for Monthly Report as well ---
        const ratio = theoTotal > 0.01 ? totalNet / theoTotal : 1;
        let forcedEsp = 0,
          forcedChq = 0,
          forcedCb = 0;
        (t.items_names || []).forEach((nameStr, idx) => {
          if (
            nameStr.startsWith("DIVERS - ") ||
            nameStr.startsWith("CARTE CADEAU - ")
          ) {
            const parts = nameStr.split(" - ");
            const pStr = parts.find((p) => p.includes("€"))?.replace("€", "");
            const storedP = hasStoredPrices ? Number(t.items_prices?.[idx]) : NaN;
            let pOriginal = Number.isFinite(storedP)
              ? storedP
              : parseFloat(pStr) || 0;
            // Always apply ratio if there's a mismatch, even with stored prices
            const p = (Math.abs(theoTotal - totalNet) < 0.01) ? pOriginal : pOriginal * ratio;
            dValTheo += p;
            const dName =
              parts.length >= 3 && parts[1] !== "Divers"
                ? parts[1]
                : nameStr.startsWith("CARTE CADEAU")
                  ? "Carte Cadeau"
                  : "Divers";
            tDiversNames.push(dName);
            daySums.rowTotNames.push(dName);
            const m = parts.length >= 4 ? parts[3].toLowerCase() : null;
            if (m === "esp") {
              tDiversBreakdown.esp += p;
              forcedEsp += p;
            } else if (m === "chq") {
              tDiversBreakdown.chq += p;
              forcedChq += p;
            } else if (m === "cb") {
              tDiversBreakdown.cb += p;
              forcedCb += p;
            } else {
              const totalPay = tEncEsp + tEncChq + tEncCb || 1;
              tDiversBreakdown.esp += p * (tEncEsp / totalPay);
              tDiversBreakdown.chq += p * (tEncChq / totalPay);
              tDiversBreakdown.cb += p * (tEncCb / totalPay);
            }
          }
        });
        const vTotNet = t.Vente_Val || 0;
        const stdVentePartNet = Math.max(0, vTotNet - dValTheo);
        const prestaPartNet = Math.max(0, totalNet - vTotNet);
        const remEsp = Math.max(0, tEncEsp - forcedEsp);
        const remChq = Math.max(0, tEncChq - forcedChq);
        const remCb = Math.max(0, tEncCb - forcedCb);
        const remTotalPay = remEsp + remChq + remCb;
        let rEsp = 0,
          rChq = 0,
          rCb = 0;
        if (remTotalPay > 0.01) {
          rEsp = remEsp / remTotalPay;
          rChq = remChq / remTotalPay;
          rCb = remCb / remTotalPay;
        } else {
          const totalBasePay = tEncEsp + tEncChq + tEncCb || 0.01;
          rEsp = tEncEsp / totalBasePay;
          rChq = tEncChq / totalBasePay;
          rCb = tEncCb / totalBasePay;
        }
        if (rEsp + rChq + rCb < 0.01 && totalNet > 0.01) rCb = 1;
        daySums.cEsp.s += prestaPartNet * rEsp;
        daySums.cChq.s += prestaPartNet * rChq;
        daySums.cCb.s += prestaPartNet * rCb;
        daySums.vEsp.s += stdVentePartNet * rEsp;
        daySums.vChq.s += stdVentePartNet * rChq;
        daySums.vCb.s += stdVentePartNet * rCb;
        daySums.vEsp.dSum += tDiversBreakdown.esp;
        daySums.vChq.dSum += tDiversBreakdown.chq;
        daySums.vCb.dSum += tDiversBreakdown.cb;
        if (tDiversBreakdown.esp > 0.01)
          daySums.vEspNames.push(...tDiversNames);
        if (tDiversBreakdown.chq > 0.01)
          daySums.vChqNames.push(...tDiversNames);
        if (tDiversBreakdown.cb > 0.01) daySums.vCbNames.push(...tDiversNames);
        daySums.actualTotal += totalNet;
      });
      const rowNum = aoa.length + 1;
      const dayTotPresta = daySums.cEsp.s + daySums.cChq.s + daySums.cCb.s;
      const dayTotVente =
        daySums.vEsp.s +
        daySums.vEsp.dSum +
        daySums.vChq.s +
        daySums.vChq.dSum +
        daySums.vCb.s +
        daySums.vCb.dSum;
      const dayTotNamesOrig = [...new Set(daySums.rowTotNames)];
      let dayTotNamesStr =
        isPerso && dayTotNamesOrig.length > 0
          ? ` (dont ${dayTotNamesOrig.join(" + ")})`
          : "";
      dayTotNamesStr = dayTotNamesStr.replace(/"/g, "'");
      const formattedFullDate = `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
      aoa.push([
        formattedFullDate,
        FrenchDays[new Date(year, month - 1, day).getDay()],
        formatCell(daySums.cEsp),
        formatCell(daySums.cChq),
        formatCell(daySums.cCb),
        {
          f: `C${rowNum}+D${rowNum}+E${rowNum}`,
          v: dayTotPresta,
          t: "n",
          z: '# ##0.00"€ "',
        },
        formatCell(daySums.vEsp, daySums.vEspNames),
        formatCell(daySums.vChq, daySums.vChqNames),
        formatCell(daySums.vCb, daySums.vCbNames),
        {
          f: `G${rowNum}+H${rowNum}+I${rowNum}`,
          v: dayTotVente,
          t: "n",
          z: '# ##0.00"€ "',
        },
        {
          f: `F${rowNum}+J${rowNum}`,
          v: daySums.actualTotal,
          t: "n",
          z: `# ##0.00"€ ${dayTotNamesStr}"`,
        },
      ]);
      // Update Totals
      [grandTotal, weekTotal].forEach((tot) => {
        ["cEsp", "cChq", "cCb", "vEsp", "vChq", "vCb"].forEach((k) => {
          tot[k].s += daySums[k].s;
          tot[k].dSum += daySums[k].dSum;
        });
        tot.actualTotal += daySums.actualTotal;
        tot.rowTotNames.push(...daySums.rowTotNames);
      });
      if (day === weekRanges[weekIdx].end || day === numDays) {
        const currentRow = aoa.length + 1;
        const dataRange = (col) =>
          `${col}${weekStartRow}:${col}${currentRow - 1}`;
        let wNames = [...new Set(weekTotal.rowTotNames)].join(" + ");
        let wTotStr = isPerso && wNames ? ` (dont ${wNames})` : "";
        wTotStr = wTotStr.replace(/"/g, "'");
        aoa.push([
          "Total semaine",
          "",
          {
            f: `SUM(${dataRange("C")})`,
            v: weekTotal.cEsp.s + weekTotal.cEsp.dSum,
            t: "n",
            z: '# ##0.00"€ "',
          },
          {
            f: `SUM(${dataRange("D")})`,
            v: weekTotal.cChq.s + weekTotal.cChq.dSum,
            t: "n",
            z: '# ##0.00"€ "',
          },
          {
            f: `SUM(${dataRange("E")})`,
            v: weekTotal.cCb.s + weekTotal.cCb.dSum,
            t: "n",
            z: '# ##0.00"€ "',
          },
          {
            f: `SUM(${dataRange("F")})`,
            v:
              weekTotal.cEsp.s +
              weekTotal.cEsp.dSum +
              weekTotal.cChq.s +
              weekTotal.cChq.dSum +
              weekTotal.cCb.s +
              weekTotal.cCb.dSum,
            t: "n",
            z: '# ##0.00"€ "',
          },
          {
            f: `SUM(${dataRange("G")})`,
            v: weekTotal.vEsp.s + weekTotal.vEsp.dSum,
            t: "n",
            z: '# ##0.00"€ "',
          },
          {
            f: `SUM(${dataRange("H")})`,
            v: weekTotal.vChq.s + weekTotal.vChq.dSum,
            t: "n",
            z: '# ##0.00"€ "',
          },
          {
            f: `SUM(${dataRange("I")})`,
            v: weekTotal.vCb.s + weekTotal.vCb.dSum,
            t: "n",
            z: '# ##0.00"€ "',
          },
          {
            f: `SUM(${dataRange("J")})`,
            v:
              weekTotal.vEsp.s +
              weekTotal.vEsp.dSum +
              weekTotal.vChq.s +
              weekTotal.vChq.dSum +
              weekTotal.vCb.s +
              weekTotal.vCb.dSum,
            t: "n",
            z: '# ##0.00"€ "',
          },
          {
            f: `SUM(${dataRange("K")})`,
            v: weekTotal.actualTotal,
            t: "n",
            z: `# ##0.00"€ ${wTotStr}"`,
          },
        ]);
        weekRows.push(aoa.length);
        weekStartRow = aoa.length + 1;
        weekTotal = initSums();
        weekIdx++;
      }
    }
    const totalFormula = (col) => weekRows.map((r) => `${col}${r}`).join("+");
    let mNames = [...new Set(grandTotal.rowTotNames)].join(" + ");
    let mTotStr = isPerso && mNames ? ` (dont ${mNames})` : "";
    mTotStr = mTotStr.replace(/"/g, "'");
    aoa.push([
      "Total mois",
      "",
      {
        f: totalFormula("C"),
        v: grandTotal.cEsp.s + grandTotal.cEsp.dSum,
        t: "n",
        z: '# ##0.00"€ "',
      },
      {
        f: totalFormula("D"),
        v: grandTotal.cChq.s + grandTotal.cChq.dSum,
        t: "n",
        z: '# ##0.00"€ "',
      },
      {
        f: totalFormula("E"),
        v: grandTotal.cCb.s + grandTotal.cCb.dSum,
        t: "n",
        z: '# ##0.00"€ "',
      },
      {
        f: totalFormula("F"),
        v:
          grandTotal.cEsp.s +
          grandTotal.cEsp.dSum +
          grandTotal.cChq.s +
          grandTotal.cChq.dSum +
          grandTotal.cCb.s +
          grandTotal.cCb.dSum,
        t: "n",
        z: '# ##0.00"€ "',
      },
      {
        f: totalFormula("G"),
        v: grandTotal.vEsp.s + grandTotal.vEsp.dSum,
        t: "n",
        z: '# ##0.00"€ "',
      },
      {
        f: totalFormula("H"),
        v: grandTotal.vChq.s + grandTotal.vChq.dSum,
        t: "n",
        z: '# ##0.00"€ "',
      },
      {
        f: totalFormula("I"),
        v: grandTotal.vCb.s + grandTotal.vCb.dSum,
        t: "n",
        z: '# ##0.00"€ "',
      },
      {
        f: totalFormula("J"),
        v:
          grandTotal.vEsp.s +
          grandTotal.vEsp.dSum +
          grandTotal.vChq.s +
          grandTotal.vChq.dSum +
          grandTotal.vCb.s +
          grandTotal.vCb.dSum,
        t: "n",
        z: '# ##0.00"€ "',
      },
      {
        f: totalFormula("K"),
        v: grandTotal.actualTotal,
        t: "n",
        z: `# ##0.00"€ ${mTotStr}"`,
      },
    ]);
    return aoa;
  };
  const generateMonthlyDétailedReportAOA = (
    type = "Perso",
    dataToUse = null,
  ) => {
    const data = dataToUse || getAllTransactions().filter((h) => h && h.Date && normalizeDate(h.Date).startsWith(selectedMonth));
    const isPerso = type === "Perso";
    const [year, month] = selectedMonth.split("-");
    const FrenchDays = [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
    ];
    const aoa = [
      [
        "Date",
        "Jour",
        "Client",
        "Coiffure",
        "Prix",
        "Esthétique",
        "Prix",
        "Vente",
        "Prix",
        "Esp",
        "Chq",
        "CB",
        "Total",
      ],
    ];
    const monthData = data.filter(
      (h) => h && h.Date && normalizeDate(h.Date).startsWith(selectedMonth),
    );
    let tCoiff = 0,
      tEsth = 0,
      tVente = 0,
      tEsp = 0,
      tChq = 0,
      tCb = 0,
      tGrand = 0;
    monthData
      .sort((a, b) => a.Date.localeCompare(b.Date))
      .forEach((t) => {
        let coiffNames = [],
          coiffPrix = [],
          esthNames = [],
          esthPrix = [],
          venteNames = [],
          ventePrix = [];
        const targetTotal = t.Total || 0;
        const hasStoredPrices = Array.isArray(t.items_prices);
        (t.items_names || []).forEach((name, idx) => {
          let p = 0,
            cat = "";
          const storedP = hasStoredPrices ? Number(t.items_prices?.[idx]) : NaN;
          if (Number.isFinite(storedP)) {
            p = storedP;
            if (
              name.startsWith("CARTE CADEAU - ") ||
              name.startsWith("DIVERS - ")
            ) {
              cat = "DIVERS";
            } else {
              const item = catalog[name];
              cat = item?.filtre || "";
            }
          } else if (
            name.startsWith("CARTE CADEAU - ") ||
            name.startsWith("DIVERS - ")
          ) {
            const parts = name.split(" - ");
            p =
              parseFloat(
                parts.find((p) => p.includes("€"))?.replace("€", ""),
              ) || 0;
            cat = "DIVERS";
          } else {
            const item = catalog[name];
            if (item) {
              p = item.prixVente || 0;
              cat = item.filtre;
            }
          }
          if (p >= 0) {
            let shortName = name;
            if (name.startsWith("DIVERS - ")) {
              const parts = name.split(" - ");
              shortName =
                parts.length >= 3 && parts[1] !== "Divers"
                  ? parts[1]
                  : "Divers";
            } else if (name.startsWith("CARTE CADEAU - "))
              shortName = "Carte Cadeau";
            if (availableFilters.ESTHETIQUE?.includes(cat)) {
              esthNames.push(shortName);
              esthPrix.push(p);
            } else if (
              availableFilters.VENTE?.includes(cat) ||
              cat === "DIVERS"
            ) {
              venteNames.push(cat === "DIVERS" ? shortName : "");
              ventePrix.push(p);
            } else {
              coiffNames.push(shortName);
              coiffPrix.push(p);
            }
          }
        });
        const formatNames = (names) =>
          names.length === 0 ? "" : [...new Set(names)].join(", ");
        const formatPrice = (prices, names, showDétail = true) => {
          const sum = prices.reduce((a, b) => a + b, 0) || 0;
          if (isPerso && showDétail) {
            let Détail = prices
              .map((p, i) =>
                Math.abs(p) > 0.01 && names[i]
                  ? `${p.toFixed(2)}€  ${names[i]}`
                  : null,
              )
              .filter(Boolean)
              .join(" + ");
            if (Détail.length > 150) Détail = Détail.substring(0, 147) + "...";
            if (Détail)
              return { v: sum, t: "n", z: `# ##0.00"€  (${Détail})"` };
          }
          return { v: sum, t: "n", z: '# ##0.00"€ "' };
        };
        if (!hasStoredPrices) {
          // Scaling
          let reconstructedTotal =
            coiffPrix.reduce((a, b) => a + b, 0) +
            esthPrix.reduce((a, b) => a + b, 0) +
            ventePrix.reduce((a, b) => a + b, 0);
          if (Math.abs(targetTotal - reconstructedTotal) > 0.01) {
            if (reconstructedTotal > 0.01) {
              const ratio = targetTotal / reconstructedTotal;
              coiffPrix = coiffPrix.map((p) => p * ratio);
              esthPrix = esthPrix.map((p) => p * ratio);
              ventePrix = ventePrix.map((p) => p * ratio);
            } else if (targetTotal > 0.01) {
              if (coiffPrix.length > 0) coiffPrix[0] = targetTotal;
              else if (esthPrix.length > 0) esthPrix[0] = targetTotal;
              else if (ventePrix.length > 0) ventePrix[0] = targetTotal;
              else {
                coiffNames.push("Ajustement");
                coiffPrix = [targetTotal];
              }
            }
          }
        }
        let pEsp = t.Enc_Esp || 0,
          pChq = t.Enc_Chq || 0,
          pCb = t.Enc_CB || 0;
        let pTotal = pEsp + pChq + pCb;
        if (Math.abs(pTotal - targetTotal) > 0.01) {
          if (pTotal > 0.01) {
            const r = targetTotal / pTotal;
            pEsp *= r;
            pChq *= r;
            pCb *= r;
          } else if (targetTotal > 0.01) pCb = targetTotal;
          else {
            pEsp = 0;
            pChq = 0;
            pCb = 0;
          }
        }
        const rowTotNamesOrig = [
          ...new Set([...coiffNames, ...esthNames, ...venteNames]),
        ].filter((n) => n.includes("Divers") || n.includes("Carte"));
        const rowTotStr =
          isPerso && rowTotNamesOrig.length > 0
            ? ` (dont ${rowTotNamesOrig.join(" + ")})`
            : "";
        const rowNum = aoa.length + 1;
        const maxP = Math.max(pEsp, pChq, pCb);
        aoa.push([
          t.Date.split("-").reverse().join("/"),
          FrenchDays[new Date(t.Date).getDay()],
          t.Nom_Client || "Passant",
          formatNames(coiffNames),
          formatPrice(coiffPrix, coiffNames, false),
          formatNames(esthNames),
          formatPrice(esthPrix, esthNames, false),
          formatNames(venteNames),
          formatPrice(ventePrix, venteNames, true),
          maxP === pEsp
            ? {
              f: `M${rowNum}-K${rowNum}-L${rowNum}`,
              v: pEsp,
              t: "n",
              z: '# ##0.00"€ "',
            }
            : formatPrice([pEsp], [], false),
          maxP === pChq
            ? {
              f: `M${rowNum}-J${rowNum}-L${rowNum}`,
              v: pChq,
              t: "n",
              z: '# ##0.00"€ "',
            }
            : formatPrice([pChq], [], false),
          maxP === pCb || maxP === 0
            ? {
              f: `M${rowNum}-J${rowNum}-K${rowNum}`,
              v: pCb,
              t: "n",
              z: '# ##0.00"€ "',
            }
            : formatPrice([pCb], [], false),
          {
            f: `E${rowNum}+G${rowNum}+I${rowNum}`,
            v: targetTotal,
            t: "n",
            z: `# ##0.00"€ ${rowTotStr}"`,
          },
        ]);
        tCoiff += coiffPrix.reduce((a, b) => a + b, 0);
        tEsth += esthPrix.reduce((a, b) => a + b, 0);
        tVente += ventePrix.reduce((a, b) => a + b, 0);
        tEsp += pEsp;
        tChq += pChq;
        tCb += pCb;
        tGrand += targetTotal;
      });
    const lastRow = aoa.length;
    aoa.push([
      "TOTAL",
      "",
      "",
      "",
      { f: `SUM(E2:E${lastRow})`, v: tCoiff, t: "n", z: '# ##0.00"€ "' },
      "",
      { f: `SUM(G2:G${lastRow})`, v: tEsth, t: "n", z: '# ##0.00"€ "' },
      "",
      { f: `SUM(I2:I${lastRow})`, v: tVente, t: "n", z: '# ##0.00"€ "' },
      { f: `SUM(J2:J${lastRow})`, v: tEsp, t: "n", z: '# ##0.00"€ "' },
      { f: `SUM(K2:K${lastRow})`, v: tChq, t: "n", z: '# ##0.00"€ "' },
      { f: `SUM(L2:L${lastRow})`, v: tCb, t: "n", z: '# ##0.00"€ "' },
      { f: `SUM(M2:M${lastRow})`, v: tGrand, t: "n", z: '# ##0.00"€ "' },
    ]);
    return aoa;
  };
  const generateInventoryReportAOA = (gamme) => {
    if (!gamme) return [];
    // Support filtre par gamme OU par fournisseur
    const isGamme = Object.values(catalog).some((i) => i.gamme === gamme);
    const filterFn = (item) =>
      isGamme ? item.gamme === gamme : item.fournisseur === gamme;
    const venteItems = Object.keys(catalog).filter(
      (name) => catalog[name].type === "retail" && filterFn(catalog[name]),
    );
    const techItems = Object.keys(catalog).filter(
      (name) => catalog[name].type === "technical" && filterFn(catalog[name]),
    );
    const buildTable = (title, items) => {
      const rows = [
        [title, "", "", "", "", "", ""],
        [
          "Produits",
          "Gamme",
          "Fournisseur",
          "Quantité",
          "PUHT",
          "TVA",
          "Total HT",
        ],
      ];
      let totalHT = 0;
      items.sort().forEach((name) => {
        const item = catalog[name];
        const invItem = (
          inventory[item.type === "retail" ? "vente" : "technique"] || []
        ).find((i) => i.nom === name);
        const qty = invItem ? invItem.quantite : 0;
        const puht = item.prixAchat || 0;
        const lineHT = qty * puht;
        totalHT += lineHT;
        rows.push([
          name,
          item.gamme || "-",
          item.fournisseur || "-",
          qty || "",
          puht > 0 ? puht.toFixed(2) : "",
          "20%",
          lineHT > 0 ? lineHT.toFixed(2) : "",
        ]);
      });
      const MIN_STOCK_ROWS = 15;
      for (let i = items.length; i < MIN_STOCK_ROWS; i++) {
        rows.push(["", "", "", "", "", "", ""]);
      }
      rows.push(["TOTAL", "", "", "", "", "", totalHT.toFixed(2)]);
      return rows;
    };
    const aoaVente = buildTable(`${gamme} - PRODUITS DE VENTE`, venteItems);
    const aoaTech = buildTable(`${gamme} - PRODUITS TECHNIQUES`, techItems);
    return [...aoaVente, [""], ...aoaTech];
  };
  const exportInventoryExcel = (gamme) => {
    const aoa = generateInventoryReportAOA(gamme);
    if (aoa.length === 0)
      return alert("Aucun produit trouvé pour cette gamme.");
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // addBorders(ws);
    // Ajuster largeurs de colonnes
    ws["!cols"] = calcAutoWidth(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventaire");
    saveExcelToFolder(wb, `Inventaire_${gamme}.xlsx`, "Rapport Stock Inventaire", new Date().toISOString().slice(0, 10));
  };
  const exportDailyStyledExcel = (filenameSuffix = "") => {
    if (!selectedDay) return alert("❌Veuillez sélectionner un jour.");
    const dateFormatted = selectedDay.split("-").reverse().join("_");
    const filename = `Fiche_Jour_${dateFormatted}${filenameSuffix ? "_" + filenameSuffix : ""}.xlsx`;
    const aoa = generateDailyReportAOA();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // addBorders(ws); // ADD STYLING
    // Ajuster largeurs de colonnes (10 colonnes : Noms | Coiffure | Prix | Esth | Prix | Vente | Prix | Esp | Chq | CB)
    ws["!cols"] = calcAutoWidth(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fiche Journalière");
    saveExcelToFolder(wb, filename, "Rapport Journalier", selectedDay);
    // Feedback
    const msg = document.createElement("div");
    msg.innerHTML = " 📊 Fichier Excel généré : " + filename;
    msg.style.cssText =
      "position:fixed; bottom:20px; right:20px; background:#27ae60; color:white; padding:10px 20px; borderRadius:10px; zIndex:20000; animation: fadeOut 3s forwards;";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };
  const exportMonthlyStyledExcel = (filenameSuffix = "") => {
    if (!selectedMonth) return alert(" ⚠️ Veuillez sélectionner un mois.");
    const aoa = generateMonthlyReportAOA();
    const filename = `Fiche_Mensuelle_${selectedMonth}${filenameSuffix ? "_" + filenameSuffix : ""}.xlsx`;
    const merges = [
      { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } }, // PRESTATIONS COIFFURE
      { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } }, // VENTES
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Date
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Jour
      { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } }, // Total Coiffure
      { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } }, // Total ventes
      { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // Total général
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = merges;
    // addBorders(ws); // ADD STYLING
    ws["!cols"] = calcAutoWidth(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fiche Mensuelle");
    saveExcelToFolder(wb, filename, "Rapport Mensuel Compta", selectedMonth);
    // Feedback
    const msg = document.createElement("div");
    msg.innerHTML = " 📊 Fichier Excel généré : " + filename;
    msg.style.cssText =
      "position:fixed; bottom:20px; right:20px; background:#9b59b6; color:white; padding:10px 20px; borderRadius:10px; zIndex:20000; animation: fadeOut 3s forwards;";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };
  // --- LOGIQUE AUTO-SYNC DRIVE (File System Access API) ---
  // Note: connectToDrive removed for simplification. Use recoverFromDrive to link a file.
  const verifyDrivePermission = async () => {
    if (!fileHandle) {
      alert(
        " s ️ Aucun fichier n'est lié. Veuillez d'abord 'Importer / Restaurer'.",
      );
      return;
    }
    try {
      // Pour Chrome/Edge, on demande explicitement l'accès readwrite
      const status = await fileHandle.requestPermission({ mode: "readwrite" });
      if (status === "granted") {
        setIsDriveVerifying(false);
        await loadFromDrive(fileHandle);
        console.log(" ✅ Connexion Drive rétablie !");
      } else {
        alert(
          " s ️ Permission refusée par le navigateur. Vous ne pourrez pas sauvegarder.",
        );
      }
    } catch (err) {
      console.error("❌Erreur de vérification permission:", err);
      // Si c'est un canevas de sécurité ou si le fichier a bougé
      alert(
        "❌Impossible de rouvrir le fichier : " +
        err.message +
        "\n\nAstuce : Essayez de le ré-importer via le bouton 'Importer / Restaurer'.",
      );
    }
  };
  const loadFromDrive = async (handle = fileHandle) => {
    if (!handle) return;
    try {
      setFileHandle(handle);
      await saveHandleToIDB(handle); // SAUVEGARDE EN DUR
      const file = await handle.getFile();
      if (file?.name && file.name !== EXPECTED_DRIVE_FILENAME) {
        alert(
          `❌ Mauvais fichier sélectionné.\n\nFichier attendu : ${EXPECTED_DRIVE_FILENAME}\nFichier reçu : ${file.name}`,
        );
        setFileHandle(null);
        setIsDriveInitialized(false);
        setIsDriveVerifying(false);
        return;
      }
      const content = await file.text();
      if (!content || content.trim() === "") {
        setIsDriveInitialized(true);
        console.log(" ✅ Fichier lié ! (Le fichier est actuellement vide)");
        return;
      }
      let data;
      try {
        data = JSON.parse(content);
        if (!data || typeof data !== 'object') throw new Error("Format invalide");
      } catch (e) {
        console.error(" ❌ JSON error:", e);
        return alert(
          " ❌ Erreur : Le fichier n'est pas un JSON valide.\n\nDétails : " +
          e.message,
        );
      }
      // Application des Données avec validation
      if (Array.isArray(data.history)) setHistory(data.history);
      if (Array.isArray(data.clients)) setClients(data.clients);
      if (data.catalog && typeof data.catalog === 'object') setCatalog(data.catalog);
      if (data.inventory && typeof data.inventory === 'object') setInventory(data.inventory);
      if (Array.isArray(data.invEntries)) setInvEntries(data.invEntries);
      if (Array.isArray(data.receivedScans)) setReceivedScans(data.receivedScans);
      if (data.archives && typeof data.archives === 'object' && !Array.isArray(data.archives)) setArchives(data.archives);
      if (Array.isArray(data.favorites)) setFavorites(data.favorites);
      if (data.trash && typeof data.trash === 'object' && !Array.isArray(data.trash)) {
        setTrash({
          catalog: data.trash.catalog || {},
          clients: data.trash.clients || [],
          inventory: data.trash.inventory || []
        });
      }

      setIsDriveInitialized(true);
      console.log(" ✅ Drive synchronisé avec succès !");
    } catch (err) {
      console.error("Recover failed:", err);
    }
  };
  const recoverFromDrive = async () => {
    if (!window.showOpenFilePicker) {
      alert(
        " ❌ Votre navigateur n'est pas compatible avec la synchronisation Drive.\n\nVeuillez utiliser Google Chrome ou Microsoft Edge pour cette fonctionnalité.",
      );
      return;
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "JSON File",
            accept: { "application/json": [".json"] },
          },
        ],
        multiple: false,
      });
      const file = await handle.getFile();
      if (file?.name && file.name !== EXPECTED_DRIVE_FILENAME) {
        alert(
          ` ❌ Mauvais fichier sélectionné.\n\nFichier attendu : ${EXPECTED_DRIVE_FILENAME}\nFichier reçu : ${file.name}`,
        );
        return;
      }
      const content = await file.text();
      if (!content || content.trim() === "") {
        return alert(
          " ❌ Erreur : Le fichier sélectionné est vide. Impossible de restaurer.",
        );
      }
      let data;
      try {
        data = JSON.parse(content);
      } catch (e) {
        console.error(" ❌ JSON error:", e);
        return alert(
          " ❌ Erreur : Le fichier n'est pas un JSON valide.\n\nDétails : " +
          e.message,
        );
      }
      if (
        window.confirm(
          " ⚠️ Attention : Recharger ce fichier va ÉCRASER toutes les Données actuelles de ce PC. Voulez-vous continuer ?",
        )
      ) {
        // Application avec validation
        if (Array.isArray(data.history)) setHistory(data.history);
        if (Array.isArray(data.clients)) setClients(data.clients);
        if (data.catalog && typeof data.catalog === 'object') setCatalog(data.catalog);
        if (data.inventory && typeof data.inventory === 'object') setInventory(data.inventory);
        if (Array.isArray(data.invEntries)) setInvEntries(data.invEntries);
        if (Array.isArray(data.receivedScans)) setReceivedScans(data.receivedScans);
        if (data.archives && typeof data.archives === 'object' && !Array.isArray(data.archives)) setArchives(data.archives);
        if (Array.isArray(data.favorites)) setFavorites(data.favorites);
        if (data.trash && typeof data.trash === 'object' && !Array.isArray(data.trash)) {
          setTrash({
            catalog: data.trash.catalog || {},
            clients: data.trash.clients || [],
            inventory: data.trash.inventory || []
          });
        }

        setIsDriveInitialized(true);
        setFileHandle(handle); // Lier le fichier pour les prochaines sauvegardes
        saveHandleToIDB(handle);
        setIsDriveVerifying(false);
        console.log(
          " ✅ Données récupérées avec succès ! L'Auto-Sync est activé sur ce fichier.",
        );
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(" ❌ Recover failed:", err);
      alert(
        " ❌ Erreur lors de la récupération : " +
        err.message +
        "\n\nAssurez-vous que le fichier est bien un fichier .json valide.",
      );
    }
  };
  // Note: resetFactoryData and its button were removed as requested to avoid data loss risk.
  const saveToDrive = async (handle = fileHandle) => {
    if (!handle || !isDriveInitialized) return;
    try {
      setIsSavingToDrive(true);
      const writable = await handle.createWritable();
      const content = JSON.stringify(
        {
          history,
          clients,
          catalog,
          inventory,
          invEntries,
          receivedScans,
          archives,
          favorites,
          trash,
        },
        null,
        2,
      );
      await writable.write(content);
      await writable.close();
      console.log(" 👤  Sauvegarde Auto-Sync effectuée sur le Drive.");
    } catch (err) {
      console.error("Auto-sync save failed:", err);
    } finally {
      setIsSavingToDrive(false);
    }
  };
  // Trigger saveToDrive on changes
  useEffect(() => {
    if (fileHandle) {
      const timer = setTimeout(() => saveToDrive(), 1000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [
    history,
    clients,
    catalog,
    inventory,
    invEntries,
    receivedScans,
    archives,
    favorites,
    trash,
  ]);
  // --- COMPOSANT INDICATEUR SYNC (NUAGE) ---
  const renderSyncIndicator = () => {
    let color = "#e74c3c"; // Rouge par défaut
    let label = "Déconnecté";
    let icon = "❌";
    if (isSavingToDrive) {
      color = "#f39c12"; // Orange
      label = "Sauvegarde en cours...";
      icon = "⏳";
    } else if (fileHandle && isDriveInitialized && !isDriveVerifying) {
      color = "#2ecc71"; // Vert
      label = "Sauvegarde active";
    } else if (fileHandle && (isDriveVerifying || !isDriveInitialized)) {
      color = "#f39c12"; // Orange
      label = "En cours d'activation...";
    } else {
      color = "#e74c3c"; // Rouge
      label = "Sauvegarde désactivée";
    }
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          background: "transparent",
          padding: "2px 5px",
          borderRadius: "15px",
          cursor: "pointer",
          transition: "all 0.3s",
          marginLeft: "auto",
          marginRight: "5px",
          alignSelf: "center",
        }}
        className="sync-indicator-minimal"
        onClick={() => {
          if (!fileHandle) recoverFromDrive();
          else if (!isDriveInitialized) verifyDrivePermission();
        }}
        title={label}
      >
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}` }}></div>
        <span style={{ fontSize: "9px", fontWeight: "bold", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </span>
      </div>
    );
  };
  // --- COMPOSANT GARDE-BARRI ^RE DRIVE (OBLIGATOIRE) ---
  const renderDriveGatekeeper = () => {
    const isCompatible = !!window.showOpenFilePicker;
    const expectedDriveFilename = EXPECTED_DRIVE_FILENAME;
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(26, 26, 26, 0.98)",
          zIndex: 200000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px",
          textAlign: "center",
          color: "white",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "30px",
            maxWidth: "500px",
            width: "90%",
            color: "#333",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          <h1 style={{ fontSize: "40px", marginBottom: "10px" }}> 🔐 </h1>
          <h2
            style={{
              color: isCompatible ? "#00bfff" : "#e74c3c",
              marginBottom: "15px",
            }}
          >
            {isCompatible ? "Action Requise" : "Navigateur Non Compatible"}
          </h2>
          <h3 style={{ marginBottom: "20px" }}> 📦  Synchronisation Drive</h3>
          {!isCompatible ? (
            <div>
              <p
                style={{
                  color: "#e74c3c",
                  fontWeight: "bold",
                  marginBottom: "20px",
                }}
              >
                Attention : Votre navigateur actuel ne supporte pas la
                synchronisation des fichiers.
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "30px",
                }}
              >
                Pour utiliser la sauvegarde Google Drive, veuillez ouvrir
                l'application dans <strong>Google Chrome</strong> ou{" "}
                <strong>Microsoft Edge</strong>.
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: "25px" }}>
              <div
                style={{
                  padding: "12px",
                  background: "#f8f9fa",
                  borderRadius: "15px",
                  border: "1px solid #eee",
                  color: "#666",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  textAlign: "left",
                }}
              >
                <div style={{ fontWeight: "bold", color: "#2d3436" }}>
                  Fichier attendu : {expectedDriveFilename}
                </div>
                <div style={{ marginTop: "6px" }}>
                  {fileHandle
                    ? `Fichier lié : ${fileHandle.name}`
                    : "Aucun fichier lié pour l'instant."}
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>
                Si tout est déjà vert ("Sauvegarde active"), vous n'avez rien à faire.
              </div>
            </div>
          )}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {isCompatible && (
              <button
                className="pay-btn"
                style={{
                  background: "#f39c12",
                  margin: 0,
                  width: "100%",
                  padding: "0 25px",
                  height: "50px",
                  borderRadius: "12px",
                }}
                onClick={verifyDrivePermission}
              >
                🔄 Re-Vérifier Permission
              </button>
            )}
            {isCompatible && (
              <button
                className="pay-btn"
                style={{
                  background: "#9b59b6",
                  margin: 0,
                  width: "100%",
                  padding: "0 25px",
                  height: "50px",
                  borderRadius: "12px",
                }}
                onClick={recoverFromDrive}
              >
                📥 Importer / Restaurer Fichier
              </button>
            )}
            {!isCompatible && (
              <button
                className="pay-btn"
                style={{
                  background: "#95a5a6",
                  padding: "15px",
                  fontSize: "16px",
                  color: "white",
                  width: "100%",
                  margin: 0,
                }}
                onClick={() => window.location.reload()}
              >
                🔄 Actualiser la page
              </button>
            )}
          </div>
          <div
            style={{
              marginTop: "25px",
              padding: "15px",
              background: "#f8f9fa",
              borderRadius: "15px",
              fontSize: "12px",
              color: "#666",
              textAlign: "left",
              border: "1px solid #eee",
            }}
          >
            <strong> 💡 Pourquoi cette étape ?</strong>
            <br />
            {isCompatible
              ? "Par sécurité, le navigateur verrouille l'accès si vous rafraîchissez la page. Un clic suffit à le rouvrir !"
              : "Le mode Desktop (Chrome/Edge) est indispensable pour accéder directement aux fichiers locaux synchronisés."}
          </div>
        </div>
      </div>
    );
  };
  // --- UI HELPERS ---
  const getItemIcon = (name, filtre, type) => {
    const emoji = getCorrectEmoji(type);
    if (emoji) {
      if (name && name.startsWith(emoji)) return "";
      return emoji;
    }
    // Emojis intelligents par mot-clé dans le nom (fonctionne aussi pour les nouvelles prestations)
    const n = (name || "").toLowerCase();
    // Coiffure
    if (n.includes("chignon")) return "👩‍🦱";
    if (n.includes("tresse")) return "🎀";
    if (n.includes("barbe")) return "🧔";
    if (n.includes("coloration") || n.includes("couleur")) return "🎨";
    if (n.includes("balayage")) return "🌈";
    if (n.includes("permanente")) return "🌀";
    if (n.includes("décoloration")) return "⚡";
    if (n.includes("tie") && n.includes("dye")) return "🔥";
    if (n.includes("ombré")) return "🌅";
    if (n.includes("pastel")) return "🦄";
    if (n.includes("lissage")) return "✨";
    if (n.includes("coupe") && n.includes("coiffage")) return "✂️";
    if (n.includes("coupe")) return "✂️";
    if (n.includes("coiffage") || n.includes("brushing")) return "💇‍♀️";
    if (n.includes("soin botox")) return "💎";
    if (n.includes("soin milkshake")) return "🥤";
    if (n.includes("soin profond")) return "🧴";
    if (n.includes("soin léger")) return "💧";
    if (n.includes("soin minceur")) return "🏋️‍♀️";
    if (n.includes("soin bien") || n.includes("relaxant")) return "🧘‍♀️";
    if (n.includes("soin boost") || n.includes("énergie")) return "⚡";
    if (n.includes("soin lift") || n.includes("anti")) return "✨";
    if (n.includes("soin pureté") || n.includes("detox")) return "🌿";
    if (n.includes("soin hydrat") || n.includes("apaisant")) return "💦";
    if (n.includes("soin express")) return "⏱️";
    if (n.includes("modelage")) return "💆‍♀️";
    if (n.includes("shampooing")) return "🧴";
    // Esthétique - Épilation
    if (n.includes("forfait visage") || n.includes("sourcil") || n.includes("lèvre")) return "😊";
    if (n.includes("aisselle")) return "🙋‍♀️";
    if (n.includes("maillot intégral")) return "👙";
    if (n.includes("maillot")) return "👙";
    if (n.includes("jambe")) return "🦵";
    if (n.includes("bras")) return "💪";
    if (n.includes("dos") || n.includes("torse")) return "🔙";
    if (n.includes("passeport") || n.includes("corps complet")) return "🌟";
    if (n.includes("zone")) return "📍";
    // Esthétique - Ongles
    if (n.includes("manucure")) return "💅";
    if (n.includes("pédicure")) return "🦶";
    if (n.includes("gel") || n.includes("américain")) return "💎";
    if (n.includes("remplissage")) return "🔧";
    if (n.includes("semi-permanent")) return "✨";
    if (n.includes("french") || n.includes("baby")) return "🤍";
    if (n.includes("nail art")) return "🎨";
    if (n.includes("strass") || n.includes("bijou")) return "💍";
    // Esthétique - Regards
    if (n.includes("réhaussement")) return "⬆️";
    if (n.includes("extension") && n.includes("cil")) return "👁️";
    if (n.includes("micro-pigmentation")) return "✏️";
    if (n.includes("retouche")) return "🔄";
    // Maquillage
    if (n.includes("maquillage mariée")) return "👰";
    if (n.includes("maquillage soir")) return "🌙";
    if (n.includes("maquillage jour")) return "☀️";
    if (n.includes("maquillage enfant")) return "🧒";
    if (n.includes("maquillage")) return "💄";
    // Fallback par filtre
    const filtreEmojis = {
      "HOMME": "💈",
      "JUNIOR": "👦",
      "DAME COURTS": "💇‍♀️",
      "DAME LONGS": "💇‍♀️",
      "TECHNIQUE COURTS": "🎨",
      "TECHNIQUE LONGS": "🎨",
      "TECHNIQUE SEULE": "🎨",
      "TECHNIQUE HOMME": "🎨",
      "SOINS": "💧",
      "ONGLERIE": "💅",
      "EPILATION": "✨",
      "SOINS VISAGE": "🧖‍♀️",
      "REGARDS": "👁️",
      "MAQUILLAGE": "💄",
      "NAIL ART": "🎨",
      "SOINS CORPS": "🧴",
    };
    return filtreEmojis[filtre] || "";
  };
  const getChipColor = (f) => {
    if (f === "⭐ FAVORIS") return "#f1c40f"; // Jaune/Or vif
    const blue = "#00bfff";
    const pink = "#ff1493";
    const green = "#2ecc71";
    // Logique COIFFURE basée sur le nom du filtre
    if (f === "HOMME" || f === "TECHNIQUE HOMME") return blue;
    if (f === "JUNIOR" || f === "ENFANT") return green;
    if (
      f &&
      (f.includes("DAME") ||
        f.includes("FEMME") ||
        f.includes("TECHNIQUE") ||
        f === "SOINS")
    )
      return pink;
    // Logique ESTHETIQUE
    if (activeTab === "ESTHÉTIQUE") return pink;
    // Vente
    if (activeTab === "VENTE") return "#2ecc71"; // Vert produit
    return pink;
  };
  const getItemColor = (item) => {
    const data = catalog[item];
    if (!data) return "#bdc3c7";

    // L'utilisateur veut spécifiquement du VERT pour l'onglet VENTE
    if (activeTab === "VENTE") return "#2ecc71";

    const blue = "#00bfff";
    const pink = "#ff1493";
    // Vente (hors onglet Vente, ex: dans l'historique) = Violet
    if (data.type === "retail") return "#9b59b6";
    // Stock technique = Sombre
    if (data.type === "technical") return "#34495e";
    const f = data.filtre || "";
    // Logique Coiffure
    if (f === "HOMME" || f === "TECHNIQUE HOMME") return blue;
    if (f === "JUNIOR" || f === "ENFANT") return "#2ecc71"; // Vert pour Junior/Enfant
    if (
      f &&
      (f.includes("DAME") || f.includes("FEMME") || f.includes("TECHNIQUE"))
    )
      return pink;
    // Esthétique / Dame par défaut en Rose
    return pink;
  };
  const deleteItem = (name, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        ` ⚠️ Suppression de "${cleanProductName(name)}" : Voulez-vous vraiment le placer dans la corbeille ?`,
      )
    )
      return;
    const performDelete = () => {
      setCatalog((prev) => {
        const item = prev[name];
        setTrash((t) => ({
          ...t,
          catalog: { ...t.catalog, [name]: item },
        }));
        const newCat = { ...prev };
        delete newCat[name];
        return newCat;
      });
      removeFavoriteEverywhere(name);
      alert(" ✅  Élément déplacé vers la corbeille.");
    };
    if (isAuthenticated) {
      performDelete();
    } else {
      requestAccess(`Confirmer la suppression de "${cleanProductName(name).replace(/[🛒🎨]/g, "")}" ?`, performDelete);
    }
  };
  const editItem = (name, e) => {
    e.stopPropagation();
    const performEdit = () => {
      const item = catalog[name];
      if (item.type === "retail" || item.type === "technical") {
        if (
          window.confirm(
            "Ceci est un produit de stock. Voulez-vous aller à l'onglet STOCKS pour le modifier ?",
          )
        ) {
          setActiveTab("STOCKS");
          setStockTab(item.type === "retail" ? "vente" : "technique");
          setStockSearch(name);
        }
      } else {
        setNewServiceData({
          name: name,
          price: item.prixVente,
          category: item.filtre,
          isSpecial: item.isSpecial || false,
        });
        setEditingServiceOldName(name);
        setShowNewServiceModal(true);
      }
    };
    if (isAuthenticated) {
      performEdit();
    } else {
      requestAccess(`Modifier "${cleanProductName(name).replace(/[🛒🎨]/g, "")}" ?`, performEdit);
    }
  };
  const renderCatalog = () => {
    let itemsToShow = [];
    const favCtxKey = getFavoritesContextKey();
    const coiffureFilters = [
      "HOMME",
      "JUNIOR",
      "DAME COURTS",
      "DAME LONGS",
      "TECHNIQUE COURTS",
      "TECHNIQUE LONGS",
      "TECHNIQUE SEULE",
      "SOINS",
      "TECHNIQUE HOMME",
    ];
    if (
      activeTab === "COIFFURE" &&
      activeFilter === "⭐ FAVORIS" &&
      !coiffureSubTab
    ) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#7f8c8d" }}>
          <h3>Veuillez choisir une Catégorie ci-dessus 👆</h3>
          <p>(Homme, Femme, Enfant)</p>
        </div>
      );
    }
    if (search) {
      itemsToShow = Object.keys(catalog).filter((name) => {
        const item = catalog[name];
        const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (activeTab === "VENTE") return item.type === "retail" || item.type === "both";
        if (activeTab === "COIFFURE")
          return (
            !item.type && item.filtre && coiffureFilters.includes(item.filtre)
          );
        if (activeTab === "ESTHÉTIQUE")
          return (
            !item.type && item.filtre && !coiffureFilters.includes(item.filtre)
          );
        return false;
      });
    } else {
      if (activeFilter === "⭐ FAVORIS") {
        // Afficher seulement les favoris, en respectant l'onglet principal
        itemsToShow = Object.keys(catalog).filter((key) => {
          const item = catalog[key];
          // COIFFURE: séparation stricte Homme/Femme/Enfant
          if (activeTab === "COIFFURE") {
            if (!coiffureSubTab) return false;
            const expectedCtx = `COIFFURE_${coiffureSubTab}`;
            const itemCtx = getFavoriteContextKeyForItem(key);
            if (itemCtx !== expectedCtx) return false;
            const isFav = isItemFavoriteInContext(key, expectedCtx);
            if (!isFav) return false;
          } else {
            const isFav = isItemFavoriteInContext(key, favCtxKey);
            if (!isFav) return false;
          }
          if (activeTab === "VENTE") return item.type === "retail" || item.type === "both";
          if (activeTab === "COIFFURE")
            return (
              !item.type && item.filtre && coiffureFilters.includes(item.filtre)
            );
          if (activeTab === "ESTHÉTIQUE")
            return (
              !item.type &&
              item.filtre &&
              !coiffureFilters.includes(item.filtre)
            );
          return true;
        });
      } else {
        // Filtrage normal
        itemsToShow = Object.keys(catalog).filter((key) => {
          const item = catalog[key];
          if (activeTab === "VENTE") {
            // If Gift Card tab, we handle differently in the return
            if (venteSubTab === "CARTE CADEAU") return false;
            // If no activeFilter for VENTE, show items based on sub-tab choice
            if (!activeFilter) {
              if (!venteSubTab) return false; // Force choice
              return (
                (item.type === "retail" || item.type === "both") &&
                (venteSubTab === "DIVERS"
                  ? item.filtre === "DIVERS"
                  : item.filtre !== "DIVERS")
              );
            }
            // Otherwise, filter by activeFilter (which can be a fournisseur, gamme, or filtre)
            return (
              (item.type === "retail" || item.type === "both") &&
              (item.fournisseur === activeFilter ||
                item.filtre === activeFilter ||
                item.gamme === activeFilter)
            );
          }
          if (activeTab === "COIFFURE") {
            // If no activeFilter for COIFFURE, show nothing (user needs to select a sub-tab/filter)
            if (!activeFilter) return false;
            return !item.type && item.filtre === activeFilter;
          }
          if (activeTab === "ESTHÉTIQUE") {
            // If no activeFilter for ESTHETIQUE, show nothing
            if (!activeFilter) return false;
            return !item.type && item.filtre === activeFilter;
          }
          return false;
        });
      }
    }
    if (activeTab === "VENTE" && venteSubTab === "CARTE CADEAU") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            background: "#fff9fe",
            borderRadius: "20px",
            border: "2px dashed #9b59b6",
          }}
        >
          <h1 style={{ fontSize: "60px", margin: "0 0 20px 0" }}> 🌟 </h1>
          <h2 style={{ color: "#9b59b6", marginBottom: "10px" }}>
            Vendre une Carte Cadeau
          </h2>
          <p
            style={{ color: "#666", marginBottom: "25px", textAlign: "center" }}
          >
            Saisissez le montant et le nom/note pour la carte cadeau.
          </p>
          <button
            className="pay-btn"
            style={{
              background: "#9b59b6",
              padding: "15px 40px",
              fontSize: "18px",
            }}
            onClick={() => {
              setGiftCardData({ amount: "", name: "" });
              setShowGiftCardModal(true);
            }}
          >
            ➕ Créer la Carte Cadeau
          </button>
        </div>
      );
    }
    if (activeTab === "VENTE" && !activeFilter && !venteSubTab) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#7f8c8d" }}>
          <h3>Veuillez choisir une Catégorie ci-dessus 👆</h3>
          <p>(Produit, Divers, Carte Cadeau...)</p>
        </div>
      );
    }
    // If no filter selected (starting Coiffure without sub-tab)
    if (activeTab === "COIFFURE" && !activeFilter && !coiffureSubTab) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#7f8c8d" }}>
          <h3>Veuillez choisir une Catégorie ci-dessus 👆</h3>
          <p>(Homme, Dame, Enfant...)</p>
        </div>
      );
    }
    // If sub-tab selected but no filter (ex: Femme -> waits for choice Dame Courts/Longs etc if we want to force)
    // But here we set DAME COURTS by default in the useEffect for Femme ?
    // User asked "Il faut qu'il y a rien de sélectionner".
    // So if coiffureSubTab is "FEMME", we should perhaps NOT set DAME COURTS default?
    // I'll leave the useEffect but make sure we respect "activeFilter" being null if logic allows.
    // Actually, in the useEffect I put `else setActiveFilter(null)` for general case, but for FEMME I put DAME COURTS.
    // The user said "pareil pour homme et enfant". So I should probably remove the defaults in useEffect too?
    // Let's rely on the user clicking the chips.
    return (
      <div className="catalog-grid">
        {itemsToShow.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              color: "#999",
              marginTop: "30px",
            }}
          >
            Aucun élément trouvé dans "{activeFilter}"
          </div>
        )}
        {itemsToShow
          .sort((a, b) =>
            a.localeCompare(b, undefined, {
              numeric: true,
              sensitivity: "base",
            }),
          )
          .map((item) => {
            const itemData = catalog[item];
            if (!itemData) return null;
            const color = getItemColor(item);
            const itemIcon = getItemIcon(item, itemData.filtre, itemData.type);
            const isFav = isItemFavoriteInContext(item, favCtxKey);
            const isFestive = itemData.isSpecial;
            return (
              <button
                key={item}
                className={`item-card ${isFav ? "active-fav" : ""} ${isFestive ? "festive" : ""}`}
                onClick={() => addToCart(item)}
                style={{
                  borderLeft: `5px solid ${color}`,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px",
                  minHeight: "145px"
                }}
              >
                {/* Étoile Favori Direct - Plus Visible */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteInContext(item, favCtxKey);
                  }}
                  title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  style={{
                    position: "absolute",
                    top: "5px",
                    left: "5px",
                    fontSize: "24px",
                    lineHeight: "1",
                    cursor: "pointer",
                    color: isFav ? "#f1c40f" : "#bdc3c7",
                    zIndex: 100,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  {isFav ? "★" : "☆"}
                </div>

                {/* Boutons d'action en haut à droite (pour ne pas gêner le prix) */}
                <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "4px", zIndex: 10 }}>
                  <div
                    onClick={(e) => editItem(item, e)}
                    title="Modifier"
                    style={{
                      fontSize: "14px",
                      cursor: "pointer",
                      background: "rgba(255,255,255,0.9)",
                      borderRadius: "50%",
                      padding: "3.5px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ✏️
                  </div>
                  <div
                    onClick={(e) => deleteItem(item, e)}
                    title="Supprimer"
                    style={{
                      fontSize: "14px",
                      cursor: "pointer",
                      background: "rgba(255,255,255,0.9)",
                      borderRadius: "50%",
                      padding: "3.5px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    🗑️
                  </div>
                </div>

                {/* Contenu Central : Titre et Fournisseur (Descendu pour éviter les icônes) */}
                <div style={{ textAlign: "center", marginTop: "30px", marginBottom: "5px" }}>
                  <span className="item-name" style={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    display: "block",
                    lineHeight: "1.2"
                  }}>
                    {cleanProductName(item)}
                  </span>

                  {activeTab === "VENTE" && (
                    <div style={{ marginTop: "4px" }}>
                      <span
                        style={{
                          background: "#fff3e0",
                          color: "#e67e22",
                          borderRadius: "4px",
                          padding: "1.5px 7px",
                          fontWeight: "bold",
                          fontSize: "10px",
                          display: "inline-block"
                        }}
                      >
                        {itemData.fournisseur || itemData.filtre || "PRODUIT"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Prix en bas */}
                <span className="item-price" style={{
                  color: color,
                  fontSize: "16px",
                  fontWeight: "800",
                  marginTop: "auto"
                }}>
                  {(Number(itemData.prixVente) || 0).toFixed(2)} €
                </span>
              </button>
            );
          })
        }
      </div >
    );
  };
  // Helper pour formater le téléphone (ex: 06 12 34 56 78)
  const formatPhoneNumber = (value) => {
    // 1. Ne garder que les chiffres
    const clean = String(value || "").replace(/\D/g, "");
    // 2. Limiter à 10 chiffres max (on tolére 9 pour l'utilisateur)
    const truncated = (clean || "").substring(0, 10);
    // 3. Ajouter les espaces tous les 2 chiffres
    const formatted = truncated.replace(/(\d{2})(?=\d)/g, "$1 ");
    return formatted;
  };
  const renderGiftCardModal = () => {
    if (!showGiftCardModal) return null;
    return (
      <div className="modal-overlay" style={{ zIndex: 3000 }}>
        <div
          className="modal-content"
          style={{ maxWidth: "400px", padding: "30px" }}
        >
          <h2
            style={{
              color: "#9b59b6",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            🌟  Créer une Carte Cadeau
          </h2>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Montant (€)
            </label>
            <input
              type="number"
              className="search-input"
              style={{ width: "100%" }}
              value={giftCardData.amount === 0 || giftCardData.amount === "" ? "" : giftCardData.amount}
              onChange={(e) =>
                setGiftCardData({ ...giftCardData, amount: e.target.value })
              }
              onFocus={(e) => e.target.select()}
              onBlur={() => { if (giftCardData.amount === "") setGiftCardData({ ...giftCardData, amount: 0 }); }}
              placeholder="Ex: 50"
              autoFocus
            />
          </div>
          <div style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Nom ou Note (Optionnel)
            </label>
            <input
              type="text"
              className="search-input"
              style={{ width: "100%", textTransform: "uppercase" }}
              value={giftCardData.name}
              onChange={(e) =>
                setGiftCardData({ ...giftCardData, name: e.target.value.toUpperCase() })
              }
              placeholder="POUR MARIE"
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="pay-btn"
              style={{ background: "#eee", color: "#666" }}
              onClick={() => setShowGiftCardModal(false)}
            >
              Annuler
            </button>
            <button
              className="pay-btn"
              style={{ background: "#9b59b6" }}
              onClick={() => {
                const amount = parseFloat(giftCardData.amount);
                if (isNaN(amount) || amount <= 0) {
                  alert("❌ Veuillez saisir un montant valide.");
                  return;
                }
                const label = giftCardData.name
                  ? `CARTE CADEAU - ${amount}€ (${giftCardData.name})`
                  : `CARTE CADEAU - ${amount}€`;
                addToCart(label);
                setShowGiftCardModal(false);
              }}
            >
              Ajouter au Panier
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderClientModal = () => {
    if (!showClientModal) return null;
    const isEditing = clientFormData.id !== null;
    return (
      <div className="modal-overlay" style={{ zIndex: 3000 }}>
        <div
          className="modal-content"
          style={{ maxWidth: "400px", padding: "30px" }}
        >
          <h2
            style={{
              color: "var(--primary)",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {isEditing ? ` 👤  Modifier Client` : ` 👤  Nouveau Client`}
          </h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Nom
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: "100%", textTransform: "uppercase" }}
                value={clientFormData.nom}
                onChange={(e) =>
                  setClientFormData({ ...clientFormData, nom: e.target.value.toUpperCase() })
                }
                placeholder="DUPONT"
                autoFocus
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Prénom
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: "100%", textTransform: "uppercase" }}
                value={clientFormData.prenom}
                onChange={(e) =>
                  setClientFormData({ ...clientFormData, prenom: e.target.value.toUpperCase() })
                }
                placeholder="MARIE"
              />
            </div>
          </div>
          <div style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Téléphone
            </label>
            <input
              type="text"
              className="search-input"
              style={{ width: "100%" }}
              value={clientFormData.num}
              onChange={(e) =>
                setClientFormData({
                  ...clientFormData,
                  num: formatPhoneNumber(e.target.value),
                })
              }
              placeholder="Ex: 06 12 34 56 78"
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="pay-btn"
              style={{ background: "#eee", color: "#666" }}
              onClick={() => setShowClientModal(false)}
            >
              Annuler
            </button>
            <button
              className="pay-btn"
              style={{ background: "var(--primary)" }}
              onClick={() => {
                if (!clientFormData.nom)
                  return alert("❌ Le nom est obligatoire.");
                let cleanNum = clientFormData.num.replace(/\D/g, "");
                if (
                  cleanNum &&
                  cleanNum.length !== 10 &&
                  cleanNum.length !== 9
                ) {
                  return alert("❌ Numéro de téléphone invalide.");
                }
                if (isEditing) {
                  setClients((prev) =>
                    prev.map((cl) =>
                      cl.id === clientFormData.id
                        ? {
                          ...cl,
                          nom: clientFormData.nom,
                          prenom: clientFormData.prenom,
                          num: clientFormData.num,
                        }
                        : cl,
                    ),
                  );
                  alert(" ✅ Client modifié.");
                } else {
                  const isDuplicate = clients.some(c =>
                    c.nom.toUpperCase() === clientFormData.nom.toUpperCase() &&
                    c.prenom.toUpperCase() === clientFormData.prenom.toUpperCase() &&
                    c.num === clientFormData.num &&
                    c.id !== clientFormData.id
                  );
                  if (isDuplicate) {
                    return alert("❌ Un client avec le même nom, prénom et numéro existe déjà.");
                  }

                  setClients((prev) => [
                    ...prev,
                    {
                      id: Date.now(),
                      nom: clientFormData.nom,
                      prenom: clientFormData.prenom,
                      num: clientFormData.num,
                      visites: 0,
                      notesTechniques: []
                    },
                  ]);
                  alert(" ✅ Client ajouté.");
                }
                setShowClientModal(false);
              }}
            >
              {isEditing ? "Enregistrer" : "Créer le Client"}
            </button>
          </div>
        </div>
      </div>
    );
  };
  const addManualClient = () => {
    setClientFormData({ id: null, nom: "", prenom: "", num: "" });
    setShowClientModal(true);
  };
  const editClient = (id) => {
    const performEdit = () => {
      const c = clients.find((cl) => cl.id === id);
      if (!c) return;
      setClientFormData({ id: c.id, nom: c.nom, prenom: c.prenom || "", num: c.num });
      setShowClientModal(true);
    };
    if (isAuthenticated) {
      performEdit();
    } else {
      requestAccess("Modifier les informations client ?", performEdit);
    }
  };
  const deleteClient = (id) => {
    const c = clients.find((cl) => cl.id === id);
    if (!c) return;
    if (
      !window.confirm(
        ` ⚠️ Voulez-vous vraiment SUPPRIMER DÉFINITIVEMENT le client "${c.nom} ${c.prenom || ""}" du fichier ?\n\n(Il sera déplacé vers la corbeille)`,
      )
    )
      return;
    const performDelete = () => {
      const c = clients.find((cl) => cl.id === id);
      if (!c) return;
      setTrash((t) => {
        const updated = { ...t, clients: [...(t.clients || []), c] };
        // Sauvegarde immédiate pour éviter la perte en cas de refresh rapide
        try { localStorage.setItem("trash", JSON.stringify(updated)); } catch (e) { }
        return updated;
      });
      setClients((prev) => {
        const updated = prev.filter((cl) => cl.id !== id);
        // Sauvegarde immédiate pour éviter la perte en cas de refresh rapide
        try { localStorage.setItem("clients", JSON.stringify(updated)); } catch (e) { }
        return updated;
      });
      alert(" ✅ Client déplacé vers la corbeille.");
    };
    if (isAuthenticated) {
      performDelete();
    } else {
      requestAccess("Supprimer ce client ?", performDelete);
    }
  };
  const renderStocksTab = () => {
    const typeToFilter = stockTab === "vente" ? "retail" : "technical";
    const catalogItems = Object.keys(catalog).filter(
      (name) => catalog[name].type === typeToFilter || catalog[name].type === "both",
    );
    const invItems = (inventory[stockTab] || []).filter((i) => {
      const cat = catalog[i.nom];
      return cat && (cat.type === typeToFilter || cat.type === "both");
    });
    let allNames = Array.from(
      new Set([...catalogItems, ...invItems.map((i) => i.nom)]),
    );
    // Dynamic filtering for count and display
    if (stockSearch) {
      const s = stockSearch.toLowerCase();
      allNames = allNames.filter(
        (name) =>
          name.toLowerCase().includes(s) ||
          (catalog[name]?.barcode && catalog[name].barcode.toLowerCase().includes(s)),
      );
    }
    if (activeStockBrandFilter) {
      allNames = allNames.filter((name) => {
        const item = catalog[name];
        return item && item.fournisseur === activeStockBrandFilter;
      });
    }
    // Sort: sortOrder (asc) then natural name
    allNames.sort((a, b) => {
      const ao = catalog[a]?.sortOrder;
      const bo = catalog[b]?.sortOrder;
      const an = typeof ao === "number" && !Number.isNaN(ao) ? ao : Infinity;
      const bn = typeof bo === "number" && !Number.isNaN(bo) ? bo : Infinity;
      if (an !== bn) return an - bn;
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
    const allNamesForCount = allNames; // Now dynamic based on filters
    // Helper pour compter les vendus
    const getSoldCount = (name) => {
      let count = 0;
      allTransactions.forEach((h) => {
        if (h.items_names) {
          h.items_names.forEach((i) => {
            if (i === name) count++;
          });
        }
      });
      return count;
    };
    if (isRecordingInvoice) {
      return (
        <div
          style={{
            padding: "20px",
            width: "100%",
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
            flex: 1,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ margin: 0, color: "#9b59b6" }}>
              📊 Saisie de Facture (Entrée Stock)
            </h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="chip"
                style={{
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                }}
                onClick={() => {
                  setIsRecordingInvoice(false);
                  setInvoiceItems([]);
                  setInventoryMode(false);
                  setLastScannedProduct(null);
                }}
              >
                Annuler / Retour
              </button>
            </div>
          </div>
          {lastScannedProduct && (
            <div
              className="animate-in"
              style={{
                background: "#fff9f0",
                padding: "15px",
                borderRadius: "15px",
                border: "2px dashed #e67e22",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ margin: "0", color: "#d35400", fontSize: "16px" }}>
                  🎯 MODE INVENTAIRE ACTIF
                </h3>
                <p style={{ margin: "0", fontSize: "12px", color: "#e67e22" }}>
                  Scannez un produit pour voir ses infos ou le déstocker.
                </p>
              </div>
              {lastScannedProduct ? (
                <div
                  onClick={() => {
                    setInventoryMode(false);
                    startEditStockItem(lastScannedProduct.nom);
                  }}
                  style={{
                    background: "white",
                    padding: "15px",
                    borderRadius: "15px",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    border: "2px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#00bfff")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "18px",
                        color: "#2c3e50",
                      }}
                    >
                      {lastScannedProduct.nom}
                    </div>
                    <div style={{ fontSize: "13px", color: "#7f8c8d" }}>
                      Stock actuel :{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          color:
                            lastScannedProduct.quantite <=
                              (lastScannedProduct.seuilAlerte ??
                                (lastScannedProduct.type === "technical" ? 1 : 2))
                              ? "#e74c3c"
                              : "#2ecc71",
                        }}
                      >
                        {lastScannedProduct.quantite}
                      </span>{" "}
                      | Alerte :{" "}
                      {lastScannedProduct.seuilAlerte ??
                        (lastScannedProduct.type === "technical" ? 1 : 2)}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#bdc3c7",
                        marginTop: "4px",
                      }}
                    >
                      Code: {lastScannedProduct.barcode}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        if (window.confirm(`Confirmer la vente de 1 unité de "${lastScannedProduct.nom}" ?`)) {
                          addToCart(lastScannedProduct.nom);
                          alert(`${lastScannedProduct.nom} ajouté au panier.`);
                        }
                      }}
                      style={{
                        background: "#3498db",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "10px 15px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                    >
                      VENDRE
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Sortir 1 unité de "${lastScannedProduct.nom}" pour l'USAGE SALON ?`,
                          )
                        ) {
                          setInventory((prev) => {
                            const newInv = { ...prev };
                            const tab =
                              catalog[lastScannedProduct.nom].category ===
                                "MATÉRIEL"
                                ? "technique"
                                : "vente";
                            newInv[tab] = newInv[tab].map((item) =>
                              item.nom === lastScannedProduct.nom
                                ? {
                                  ...item,
                                  quantite: item.quantite - 1,
                                  cumulSorties: (item.cumulSorties || 0) + 1,
                                }
                                : item,
                            );
                            return newInv;
                          });
                          setLastScannedProduct((prev) => ({
                            ...prev,
                            quantite: prev.quantite - 1,
                          }));
                        }
                      }}
                      style={{
                        background: "#9b59b6",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "10px 15px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                    >
                      💇‍♂️ SALON
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#bdc3c7",
                    padding: "20px",
                    fontStyle: "italic",
                  }}
                >
                  En attente de scan...
                </div>
              )}
            </div>
          )}
          <div
            style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "15px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#666" }}
            >
              Cela <u>ajoute</u> les quantités sélectionnées à votre stock
              actuel et met à jour votre historique d'entrées.
            </p>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <button
                className="pay-btn"
                style={{
                  width: "auto",
                  background: "#3498db",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onClick={() => {
                  window._pendingCode = null;
                  window._pendingStartTime = 0;
                  setReceivedScans([]);
                  setShowScannerModal(true);
                }}
              >
                📦  Scanner via Smartphone
              </button>
            </div>
          </div>
          {/* --- FORMULAIRE NOUVEAU PRODUIT (Si actif) --- */}
          {isAddingNewProduct && (
            <div
              className="new-product-form animate-in"
              style={{
                background: "#f0faff",
                padding: "20px",
                borderRadius: "15px",
                border: "2px solid #3498db",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: "0 0 15px 0", color: "#2980b9" }}>
                {editingStockOldName ? "✏️ Modification" : "➕ Création Nouveau"} {stockTab === "vente" ? "Produit" : "Matériel"}
              </h3>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Nom du {stockTab === "vente" ? "Produit" : "Matériel"}
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "10px",
                      fontSize: "20px",
                    }}
                  >
                    💡
                  </span>
                  <input
                    id="new-item-name"
                    autoFocus
                    placeholder={
                      stockTab === "vente"
                        ? "Ex: Shampoing K..."
                        : "Ex: Serviettes, Peignes..."
                    }
                    value={newItemState.nom}
                    onChange={(e) => {
                      const rawVal = e.target.value.toUpperCase();
                      const extracted = extractLeadingSortOrderFromName(rawVal);
                      const nextNom = extracted ? extracted.cleanedName : rawVal;
                      const nextSortOrder =
                        (newItemState.sortOrder || "").toString().trim() !== ""
                          ? newItemState.sortOrder
                          : extracted
                            ? String(extracted.sortOrder)
                            : newItemState.sortOrder;
                      setNewItemState({
                        ...newItemState,
                        nom: nextNom,
                        sortOrder: nextSortOrder,
                      });

                      if (nextNom.trim().length > 1) {
                        const targetType = stockTab === "vente" ? "retail" : "technical";
                        // Find matching products of the same type
                        const matches = Object.values(catalog).filter(
                          (c) =>
                            c.type === targetType &&
                            c.nom.toLowerCase().includes(nextNom.toLowerCase())
                        );

                        // Deduplicate by name to avoid redundant suggestions
                        const uniqueMatches = [];
                        const seenNames = new Set();
                        for (const product of matches) {
                          if (!seenNames.has(product.nom)) {
                            seenNames.add(product.nom);
                            uniqueMatches.push(product);
                          }
                        }

                        setNewItemSuggestions(uniqueMatches);
                        setShowNewItemSuggestions(true);
                      } else {
                        setShowNewItemSuggestions(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Enter" || e.key === "Tab") &&
                        showNewItemSuggestions &&
                        newItemSuggestions.length > 0
                      ) {
                        e.preventDefault();
                        const item = newItemSuggestions[0];
                        setNewItemState({
                          ...newItemState,
                          nom: item.nom,
                          sortOrder:
                            item.sortOrder === 0 || item.sortOrder
                              ? String(item.sortOrder)
                              : newItemState.sortOrder,
                          fournisseur: item.fournisseur || "",
                          gamme: item.gamme || "",
                          category: item.category || "PRODUIT",
                          prixAchat: item.prixAchat ? item.prixAchat.toString() : "",
                          prixVente: item.prixVente ? item.prixVente.toString() : "",
                          type: item.type || "retail", // Default to retail if not specified
                        });
                        setShowNewItemSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (newItemState.nom.trim().length > 1 && newItemSuggestions.length > 0) {
                        setShowNewItemSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowNewItemSuggestions(false), 200);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 45px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      textTransform: "uppercase",
                    }}
                  />
                  <input
                    id="new-item-sortOrder"
                    inputMode="decimal"
                    placeholder="Tri"
                    value={newItemState.sortOrder}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewItemState({ ...newItemState, sortOrder: val });
                    }}
                    style={{
                      width: "70px",
                      marginLeft: "8px",
                      padding: "10px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      textAlign: "center",
                    }}
                    title="Ordre de tri (ex: 7.12)"
                  />
                  {showNewItemSuggestions && newItemSuggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "0 0 5px 5px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 100,
                        marginTop: "2px",
                      }}
                    >
                      {newItemSuggestions
                        .slice()
                        .sort((a, b) => {
                          const an =
                            typeof a.sortOrder === "number" && !Number.isNaN(a.sortOrder)
                              ? a.sortOrder
                              : Infinity;
                          const bn =
                            typeof b.sortOrder === "number" && !Number.isNaN(b.sortOrder)
                              ? b.sortOrder
                              : Infinity;
                          if (an !== bn) return an - bn;
                          return (a.nom || "").localeCompare(b.nom || "", undefined, {
                            numeric: true,
                            sensitivity: "base",
                          });
                        })
                        .map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "10px",
                              fontSize: "12px",
                              cursor: "pointer",
                              borderBottom: idx < newItemSuggestions.length - 1 ? "1px solid #eee" : "none",
                              background: "#fff",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                            onMouseDown={(e) => e.preventDefault()} // Prevent onBlur
                            onClick={() => {
                              setNewItemState({
                                ...newItemState,
                                nom: item.nom,
                                sortOrder:
                                  item.sortOrder === 0 || item.sortOrder
                                    ? String(item.sortOrder)
                                    : newItemState.sortOrder,
                                fournisseur: item.fournisseur || "",
                                gamme: item.gamme || "",
                                category: item.category || "PRODUIT",
                                prixAchat: item.prixAchat ? item.prixAchat.toString() : "",
                                prixVente: item.prixVente ? item.prixVente.toString() : "",
                                type: item.type || "retail", // Default to retail if not specified
                              });
                              setShowNewItemSuggestions(false);
                            }}
                          >
                            <span style={{ fontWeight: "bold", color: "#2c3e50" }}>{item.nom}</span>
                            <div style={{ textAlign: "right", color: "#7f8c8d", fontSize: "10px" }}>
                              {(item.sortOrder === 0 || item.sortOrder) && (
                                <div style={{ fontWeight: "bold", color: "#34495e" }}>
                                  Tri: {item.sortOrder}
                                </div>
                              )}
                              <div>{item.fournisseur} {item.gamme ? `- ${item.gamme}` : ""}</div>
                              {item.prixVente && <div>{item.prixVente}€ </div>}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Code-Barres / Référence
                </label>
                <div style={{ display: "flex", gap: "5px" }}>
                  <input
                    id="new-item-barcode"
                    placeholder="Scan ou saisie..."
                    value={newItemState.barcode}
                    onChange={(e) =>
                      setNewItemState({
                        ...newItemState,
                        barcode: e.target.value.toUpperCase(),
                      })
                    }
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      background: "#f9f9f9",
                      fontFamily: "monospace",
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    onClick={() => {
                      // Génération code aléatoire simple
                      const randomCode = Math.floor(
                        10000000 + Math.random() * 90000000,
                      ).toString();
                      setNewItemState({ ...newItemState, barcode: randomCode });
                    }}
                    style={{
                      padding: "0 10px",
                      background: "#eee",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                    title="Générer un code aléatoire"
                  >
                    🌟
                  </button>
                </div>
              </div>
              {/* Gamme / Marque - TOUJOURS VISIBLE */}
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Gamme / Marque (ex: Couleur, Soin...)
                </label>
                <input
                  list="gammes-list"
                  placeholder="Ex: COULEUR, SOIN, CAPILLAIRE..."
                  value={newItemState.gamme}
                  onChange={(e) =>
                    setNewItemState({
                      ...newItemState,
                      gamme: e.target.value.toUpperCase(),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ddd",
                    textTransform: "uppercase",
                  }}
                />
                <datalist id="gammes-list">
                  {Array.from(
                    new Set(
                      Object.values(catalog)
                        .map((i) => i.gamme)
                        .filter(Boolean),
                    ),
                  ).map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
              {/* SÉLECTEUR DE TYPE (VENTE / TECHNIQUE / LES DEUX) */}
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  🌟  Type de Produit (Cocher les destinations)
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[
                    { id: "retail", label: " Vente Stockable", color: "#27ae60" },
                    { id: "technical", label: " Technique / Matériel", color: "#8e44ad" },
                    { id: "both", label: " Les deux", color: "#2980b9" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setNewItemState({ ...newItemState, type: t.id })}
                      style={{
                        flex: 1,
                        padding: "8px",
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "2px solid",
                        borderColor: newItemState.type === t.id ? t.color : "#ddd",
                        background: newItemState.type === t.id ? t.color : "white",
                        color: newItemState.type === t.id ? "white" : "#666",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "15px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    Prix Achat HT (€)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newItemState.prixAchat === 0 || newItemState.prixAchat === "" ? "" : newItemState.prixAchat}
                    onChange={(e) =>
                      setNewItemState({
                        ...newItemState,
                        prixAchat: e.target.value,
                      })
                    }
                    onFocus={(e) => e.target.select()}
                    onBlur={() => { if (newItemState.prixAchat === "") setNewItemState({ ...newItemState, prixAchat: 0 }); }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                    }}
                  />
                </div>
                {/* PRIX DE VENTE : Visible si Type Vente ou Both */}
                {(newItemState.type === "retail" || newItemState.type === "both") && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      Prix Vente TTC (€)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newItemState.prixVente === 0 || newItemState.prixVente === "" ? "" : newItemState.prixVente}
                      onChange={(e) =>
                        setNewItemState({
                          ...newItemState,
                          prixVente: e.target.value,
                        })
                      }
                      onFocus={(e) => e.target.select()}
                      onBlur={() => { if (newItemState.prixVente === "") setNewItemState({ ...newItemState, prixVente: 0 }); }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "5px",
                        border: "1px solid #ddd",
                        background: "#fff9f0",
                        borderColor: "#ffeaa7",
                      }}
                    />
                  </div>
                )}
              </div>
              {/* Quantité Initiale */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Quantité Initiale (Stock)
                </label>
                <input
                  type="number"
                  value={newItemState.quantity === 0 || newItemState.quantity === "" ? "" : newItemState.quantity}
                  onChange={(e) =>
                    setNewItemState({
                      ...newItemState,
                      quantity: e.target.value,
                    })
                  }
                  onFocus={(e) => e.target.select()}
                  onBlur={() => { if (newItemState.quantity === "") setNewItemState({ ...newItemState, quantity: 0 }); }}
                  style={{
                    width: "100px",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                />
              </div>
              {/* BOUTON VALIDATION */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #eee",
                  paddingTop: "15px",
                }}
              >
                <button
                  className="pay-btn"
                  style={{
                    background: "#e74c3c",
                    color: "white",
                    width: "auto",
                  }}
                  onClick={() => {
                    setIsAddingNewProduct(false);
                    setEditingStockOldName(null);
                    setNewItemState({
                      nom: "",
                      sortOrder: "",
                      barcode: "",
                      prixAchat: 0,
                      prixVente: 0,
                      category: "PRODUIT",
                      gamme: "",
                      fournisseur: "",
                      quantity: 0,
                    });
                    setStockSearch("");
                  }}
                >
                  Annuler
                </button>
                <button
                  disabled={!newItemState.nom}
                  onClick={() => {
                    if (!newItemState.nom)
                      return alert("Le nom est obligatoire");
                    const wasEditing = !!editingStockOldName;
                    // Validation
                    const finalType = newItemState.type;
                    // Si c'est un produit de vente, le prix est obligatoire
                    if (finalType === "retail" || finalType === "both") {
                      if (
                        !newItemState.prixVente ||
                        parseFloat(newItemState.prixVente) <= 0
                      )
                        return alert(
                          "Le prix de vente est obligatoire pour les produits de vente.",
                        );
                    }
                    // On détermine le filtre :
                    // Si Divers -> "DIVERS"
                    // Si Produit -> On utilise la Gamme/Marque comme filtre (comportement existant)
                    // Si Technique -> "MATERIEL"
                    let finalFiltre = "MATERIEL";
                    if (finalType === "retail" || finalType === "both") {
                      if (newItemState.category === "DIVERS") {
                        finalFiltre = "DIVERS";
                      } else {
                        finalFiltre =
                          newItemState.gamme.toUpperCase() || "PRODUIT";
                      }
                    }
                    // Note: On pourrait utiliser la Gamme comme filtre d'affichage, mais en BDD on garde "MATERIEL" ou "PRODUIT" pour simplifier
                    const newItem = {
                      prixAchat: parseFloat(newItemState.prixAchat) || 0,
                      prixVente:
                        (finalType === "retail" || finalType === "both")
                          ? parseFloat(newItemState.prixVente) || 0
                          : 0, // 0 si technique pur
                      filtre: finalFiltre,
                      gamme: newItemState.gamme,
                      fournisseur: newItemState.fournisseur || "",
                      barcode: newItemState.barcode || "",
                      sortOrder: (() => {
                        const raw = (newItemState.sortOrder || "")
                          .toString()
                          .trim()
                          .replace(",", ".");
                        if (!raw) return undefined;
                        const n = parseFloat(raw);
                        return Number.isNaN(n) ? undefined : n;
                      })(),
                      isSpecial: false,
                      type: finalType,
                    };
                    // 1. Ajout / Modification au catalogue
                    setCatalog((prev) => {
                      const next = { ...prev };
                      const cleanName = cleanProductName(newItemState.nom);
                      const key = cleanName;

                      const oldKey = editingStockOldName;
                      if (oldKey && oldKey !== key) {
                        delete next[oldKey];
                      }
                      next[key] = {
                        ...next[key],
                        ...newItem,
                      };
                      if (next[key].sortOrder === undefined) delete next[key].sortOrder;
                      return next;
                    });
                    // On met à jour newItemState.nom pour la suite de la fonction (inventory etc)
                    const cleanName = cleanProductName(newItemState.nom);
                    const finalKey = cleanName;

                    // 2. Si édition et renommage, répercute dans les stocks + commandes
                    if (editingStockOldName && editingStockOldName !== finalKey) {
                      const oldName = editingStockOldName;
                      const newName = finalKey;
                      setInventory((prev) => {
                        const next = { ...prev };
                        ["vente", "technique"].forEach((tab) => {
                          if (!Array.isArray(next[tab])) return;
                          next[tab] = next[tab].map((it) =>
                            it.nom === oldName ? { ...it, nom: newName } : it,
                          );
                        });
                        return next;
                      });
                      setPendingOrders((prev) =>
                        prev.map((o) => (o.nom === oldName ? { ...o, nom: newName } : o)),
                      );
                    }
                    // 3. Gestion intelligente des onglets de stock (Ajout/Déplacement)
                    const qty = parseInt(newItemState.quantity) || 0;
                    setInventory((prev) => {
                      const next = { ...prev };
                      const currentName = finalKey;

                      // On s'assure que l'item est dans les bons onglets et plus dans les mauvais
                      ["vente", "technique"].forEach(tabName => {
                        const list = next[tabName] || [];
                        const exists = list.find(i => i.nom === currentName);
                        const shouldBeHere = (tabName === "vente" && (finalType === "retail" || finalType === "both")) ||
                          (tabName === "technique" && (finalType === "technical" || finalType === "both"));

                        if (shouldBeHere) {
                          if (!exists) {
                            next[tabName] = [...list, {
                              id: Date.now(),
                              nom: currentName,
                              quantite: qty,
                              cumulEntrees: qty,
                              cumulSorties: 0,
                              type: finalType
                            }];
                          } else {
                            // Update type if exists
                            next[tabName] = list.map(i => i.nom === currentName ? { ...i, type: finalType } : i);
                          }
                        } else if (exists) {
                          // Retirer de l'onglet s'il ne doit plus y être
                          next[tabName] = list.filter(i => i.nom !== currentName);
                        }
                      });
                      return next;
                    });
                    // Reset
                    setIsAddingNewProduct(false);
                    // Empêcher l'écran de livraison de s'afficher automatiquement après l'édition
                    setIsRecordingInvoice(false);
                    setEditingStockOldName(null);
                    setNewItemState({
                      nom: "",
                      sortOrder: "",
                      barcode: "",
                      prixAchat: "",
                      prixVente: "",
                      category: "PRODUIT",
                      type: stockTab === "vente" ? "retail" : "technical",
                      gamme: "",
                      fournisseur: "",
                      quantity: 1,
                    });
                    alert(
                      " ✅ " +
                      (stockTab === "vente" ? "Produit" : "Matériel") +
                      (wasEditing ? " modifié" : " créé") +
                      " avec succès !",
                    );
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "5px",
                    border: "none",
                    background: "#2ecc71",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                    opacity:
                      !newItemState.nom ||
                        (stockTab === "vente" && !newItemState.prixVente)
                        ? 0.5
                        : 1,
                  }}
                >
                  {editingStockOldName ? "Enregistrer" : "Créer & Ajouter"}
                </button>
              </div>
            </div>
          )}
          {!isAddingNewProduct && (
            <div
              style={{
                background: "#f8f9fa",
                padding: "20px",
                borderRadius: "15px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px 0",
                  color: "#2c3e50",
                  fontSize: "16px",
                }}
              >
                📦 Ajouter des produits à cette livraison
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "20px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, position: "relative" }}>
                  <div
                    style={{ display: "flex", gap: "5px", marginBottom: "8px" }}
                  >
                    <select
                      value={invoiceSearchCategory}
                      onChange={(e) => setInvoiceSearchCategory(e.target.value)}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        fontSize: "12px",
                        background: "#fff",
                      }}
                    >
                      <option value="">Toutes les marques</option>
                      {availableFilters[
                        stockTab === "vente" ? "VENTE" : "TECHNIQUE"
                      ].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <input
                      id="invoice-search"
                      placeholder=" 🔎  Chercher par nom ou code-barres..."
                      value={invoiceSearchTerm}
                      autoComplete="off"
                      onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && invoiceSearchTerm) {
                          const searchTerm = invoiceSearchTerm.toLowerCase();
                          const found = Object.keys(catalog).find(
                            (name) =>
                              name.toLowerCase().includes(searchTerm) ||
                              (catalog[name].barcode &&
                                catalog[name].barcode.includes(searchTerm)),
                          );
                          if (found) {
                            setInvoiceItems((prev) => {
                              if (prev.find((i) => i.nom === found))
                                return prev;
                              return [...prev, { nom: found, quantite: 1 }];
                            });
                            setInvoiceSearchTerm("");
                          }
                        }
                      }}
                    />
                  </div>
                  {/* SUGGESTIONS LIST */}
                  {invoiceSearchTerm.length >= 2 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "85px",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {Object.keys(catalog)
                        .filter((name) => {
                          const item = catalog[name];
                          const matchesSearch =
                            name
                              .toLowerCase()
                              .includes(invoiceSearchTerm.toLowerCase()) ||
                            (item.barcode &&
                              item.barcode.includes(invoiceSearchTerm));
                          const matchesCategory =
                            !invoiceSearchCategory ||
                            item.gamme === invoiceSearchCategory ||
                            item.filtre === invoiceSearchCategory;
                          return (
                            matchesSearch &&
                            matchesCategory &&
                            (stockTab === "vente"
                              ? item.type === "retail"
                              : item.type === "technical")
                          );
                        })
                        .map((name) => (
                          <div
                            key={name}
                            onClick={() => {
                              setInvoiceItems((prev) => {
                                if (prev.find((i) => i.nom === name))
                                  return prev;
                                return [...prev, { nom: name, quantite: 1 }];
                              });
                              setInvoiceSearchTerm("");
                            }}
                            style={{
                              padding: "10px 15px",
                              borderBottom: "1px solid #eee",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#f0faff")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
                          >
                            <span style={{ fontWeight: "bold" }}>{name}</span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#999",
                                background: "#f8f9fa",
                                padding: "2px 8px",
                                borderRadius: "10px",
                              }}
                            >
                              {catalog[name].gamme || catalog[name].filtre}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <button
                  className="pay-btn"
                  style={{ width: "auto", background: "#2ecc71", margin: 0 }}
                  onClick={() => setIsAddingNewProduct(true)}
                >
                  ➕ Nouveau Produit
                </button>
              </div>
              {invoiceItems.length > 0 && (
                <div
                  className="history-list"
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    background: "white",
                    borderRadius: "10px",
                    padding: "10px",
                    border: "1px solid #eee",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          textAlign: "left",
                          borderBottom: "1px solid #eee",
                          fontSize: "12px",
                          color: "#999",
                        }}
                      >
                        <th style={{ padding: "10px" }}>Produit</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>
                          Quantité
                        </th>
                        <th style={{ padding: "10px", textAlign: "right" }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid #f9f9f9" }}
                        >
                          <td style={{ padding: "10px", fontWeight: "bold" }}>
                            {item.nom}
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <input
                              type="number"
                              value={item.quantite === 0 ? "" : item.quantite}
                              onChange={(e) => {
                                const val = e.target.value;
                                setInvoiceItems((prev) =>
                                  prev.map((it, i) =>
                                    i === idx ? { ...it, quantite: val } : it,
                                  ),
                                );
                              }}
                              onFocus={(e) => e.target.select()}
                              onBlur={(e) => {
                                if (e.target.value === "") {
                                  setInvoiceItems((prev) =>
                                    prev.map((it, i) =>
                                      i === idx ? { ...it, quantite: 0 } : it,
                                    ),
                                  );
                                }
                              }}
                              style={{
                                width: "60px",
                                padding: "5px",
                                textAlign: "center",
                                borderRadius: "5px",
                                border: "1px solid #ddd",
                              }}
                            />
                          </td>
                          <td style={{ padding: "10px", textAlign: "right" }}>
                            <button
                              style={{
                                color: "#ff4444",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                setInvoiceItems((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                )
                              }
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  className="pay-btn"
                  style={{ width: "auto", background: "#e74c3c", margin: 0 }}
                  onClick={() => {
                    setIsRecordingInvoice(false);
                    setInvoiceItems([]);
                    setStockSearch("");
                    setInvoiceSearchTerm("");
                    setInvoiceSearchCategory("");
                  }}
                >
                  Annuler / Retour
                </button>
                <button
                  className="pay-btn"
                  style={{
                    width: "auto",
                    background: "#9b59b6",
                    margin: 0,
                    opacity: invoiceItems.length === 0 ? 0.5 : 1,
                  }}
                  disabled={invoiceItems.length === 0}
                  onClick={() => {
                    setInventory((prevInv) => {
                      const updatedInv = { ...prevInv };
                      const type = invoiceSearchCategory === "retail" ? "vente" : "technique";

                      invoiceItems.forEach((item) => {
                        const existingIdx = updatedInv[type].findIndex((i) => i.nom === item.nom);
                        if (existingIdx !== -1) {
                          updatedInv[type][existingIdx] = {
                            ...updatedInv[type][existingIdx],
                            quantite: updatedInv[type][existingIdx].quantite + item.quantite,
                            cumulEntrees: (updatedInv[type][existingIdx].cumulEntrees || 0) + item.quantite
                          };
                        } else {
                          updatedInv[type].push({
                            id: Date.now() + Math.random(),
                            nom: item.nom,
                            quantite: item.quantite,
                            cumulEntrees: item.quantite,
                            cumulSorties: 0,
                            type: catalog[item.nom]?.type === "retail" ? "retail" : "technical",
                          });
                        }
                      });
                      return updatedInv;
                    });

                    setIsRecordingInvoice(false);
                    setInvoiceItems([]);
                    setInvoiceSearchTerm("");
                    setInvoiceSearchCategory("");
                    alert(" ✅ Livraison enregistrée ! Le stock a été mis à jour.");
                  }}
                >
                  📦  Valider l'entrée en Stock
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div
        className="stock-container"
        style={{
          padding: "0 10px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* --- MODAL DÉSTOCKAGE RAPIDE --- */}
        {scannedProductForAction && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.8)",
              zIndex: 300000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "20px",
                maxWidth: "400px",
                width: "100%",
                textAlign: "center",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
            >
              <h1 style={{ fontSize: "40px", margin: "0 0 10px 0" }}> 📦 </h1>
              <h2 style={{ color: "#2c3e50", marginBottom: "10px" }}>
                Déstockage Rapide
              </h2>
              <p
                style={{
                  fontSize: "16px",
                  color: "#666",
                  marginBottom: "20px",
                }}
              >
                Produit : <strong>{scannedProductForAction.nom}</strong>
              </p>
              <div style={{ marginBottom: "25px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Quantité à retirer :
                </label>
                <input
                  type="number"
                  id="destock-quantity"
                  defaultValue="1"
                  min="1"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  style={{
                    width: "80px",
                    padding: "15px",
                    fontSize: "20px",
                    textAlign: "center",
                    borderRadius: "10px",
                    border: "2px solid #3498db",
                  }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <button
                  className="pay-btn"
                  style={{ background: "#eee", color: "#333" }}
                  onClick={() => setScannedProductForAction(null)}
                >
                  Annuler
                </button>
                <button
                  className="pay-btn"
                  style={{ background: "#e74c3c" }}
                  onClick={() => {
                    const qtyToRemove =
                      parseInt(
                        document.getElementById("destock-quantity").value,
                      ) || 0;
                    const pName = scannedProductForAction.nom;
                    const pType = (scannedProductForAction.type === "both")
                      ? (stockTab === "vente" ? "vente" : "technique")
                      : (scannedProductForAction.type === "retail" ? "vente" : "technique");
                    if (!window.confirm(`Confirmer le déstockage de ${qtyToRemove} unité(s) de "${pName}" ?`)) return;
                    setInventory((prev) => {
                      const currentList = prev[pType] || [];
                      const exists = currentList.find((i) => i.nom === pName);
                      let updatedList;
                      if (exists) {
                        updatedList = currentList.map((item) => {
                          if (item.nom === pName) {
                            return {
                              ...item,
                              quantite: Math.max(
                                0,
                                item.quantite - qtyToRemove,
                              ),
                              cumulSorties:
                                (item.cumulSorties || 0) + qtyToRemove,
                            };
                          }
                          return item;
                        });
                      } else {
                        updatedList = [
                          ...currentList,
                          {
                            id: Date.now(),
                            nom: pName,
                            quantite: 0,
                            cumulEntrees: 0,
                            cumulSorties: qtyToRemove,
                            type:
                              scannedProductForAction.type === "retail"
                                ? "retail"
                                : "technical",
                          },
                        ];
                      }
                      return { ...prev, [pType]: updatedList };
                    });
                    setScannedProductForAction(null);
                    const msg = document.createElement("div");
                    msg.innerHTML = ` 📦  -${qtyToRemove} ${pName}`;
                    msg.style.cssText =
                      "position:fixed; bottom:20px; right:20px; background:#e74c3c; color:white; padding:10px 20px; borderRadius:10px; zIndex:20000; animation: fadeOut 2s forwards;";
                    document.body.appendChild(msg);
                    setTimeout(() => msg.remove(), 2000);
                  }}
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: "0 0 15px 0",
              fontSize: "24px",
              color: "#2c3e50",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            📊 Gestion des Stocks
            <span
              style={{
                fontSize: "12px",
                background: "#e0e6ed",
                color: "#7f8c8d",
                padding: "4px 12px",
                borderRadius: "20px",
                fontWeight: "500",
              }}
            >
              {allNamesForCount.length} produits
            </span>
          </h2>
          {/* BARRE DE RECHERCHE STOCKS AVEC SCANNER */}
          <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", pointerEvents: "none", zIndex: 1 }}>🔎</span>
              <input
                type="text"
                placeholder="RECHERCHER PAR NOM OU CODE-BARRES..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value.toUpperCase())}
                style={{
                  width: "100%",
                  padding: "12px 20px 12px 48px",
                  borderRadius: "10px",
                  border: "2px solid #eee",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.3s",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  textTransform: "uppercase",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#9b59b6")}
                onBlur={(e) => (e.target.style.borderColor = "#eee")}
              />
              {stockSearch && (
                <button
                  onClick={() => setStockSearch("")}
                  style={{
                    position: "absolute",
                    right: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#999",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  ✖️
                </button>
              )}
            </div>
            <button
              className="pay-btn"
              style={{
                width: "auto",
                margin: 0,
                padding: "0 20px",
                backgroundColor: "#3498db",
                fontSize: "14px",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={() => {
                window._pendingCode = null;
                window._pendingStartTime = 0;
                setReceivedScans([]);
                setShowScannerModal(true);
              }}
            >
              📦  Scanner
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              className="filters-chips"
              style={{
                margin: 0,
                background: "#f8f9fa",
                padding: "5px",
                borderRadius: "50px",
                display: "flex",
                gap: "5px",
              }}
            >
              <button
                className={stockTab === "vente" ? "chip active" : "chip"}
                onClick={(e) => {
                  e.preventDefault();
                  setStockTab("vente");
                  setActiveStockBrandFilter(null);
                }}
                style={{
                  padding: "8px 15px",
                  borderRadius: "20px",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  fontWeight: "700",
                  backgroundColor: stockTab === "vente" ? "#e67e22" : "#fff",
                  color: stockTab === "vente" ? "white" : "#7f8c8d",
                }}
              >
                Produit de vente
              </button>
              <button
                className={stockTab === "technique" ? "chip active" : "chip"}
                onClick={(e) => {
                  e.preventDefault();
                  setStockTab("technique");
                  setActiveStockBrandFilter(null);
                }}
                style={{
                  padding: "8px 15px",
                  borderRadius: "20px",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  fontWeight: "700",
                  backgroundColor:
                    stockTab === "technique" ? "#9b59b6" : "#fff",
                  color: stockTab === "technique" ? "white" : "#7f8c8d",
                }}
              >
                Produits techniques
              </button>
              <button
                className="chip"
                onClick={() => setShowPendingOrdersModal(true)}
                style={{
                  padding: "8px 15px",
                  borderRadius: "20px",
                  border: "1px solid #3498db",
                  cursor: "pointer",
                  fontWeight: "700",
                  backgroundColor:
                    pendingOrders.length > 0 ? "#3498db" : "#fff",
                  color: pendingOrders.length > 0 ? "white" : "#3498db",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginLeft: "10px",
                }}
              >
                📝 Mes Commandes à faire{" "}
                {pendingOrders.length > 0 && (
                  <span
                    style={{
                      background: "white",
                      color: "#3498db",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                    }}
                  >
                    {pendingOrders.length}
                  </span>
                )}
              </button>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="pay-btn"
                style={{
                  width: "auto",
                  padding: "10px 20px",
                  fontSize: "13px",
                  margin: 0,
                  backgroundColor: "#9b59b6",
                  boxShadow: "0 4px 10px rgba(155, 89, 182, 0.2)",
                }}
                onClick={() => {
                  setIsRecordingInvoice(true);
                  setIsAddingNewProduct(false);
                  setStockSearch("");
                }}
              >
                📦  Ajouter Livraison
              </button>
              <button
                className="pay-btn"
                style={{
                  width: "auto",
                  padding: "10px 20px",
                  fontSize: "13px",
                  margin: 0,
                  backgroundColor: "#2ecc71",
                  boxShadow: "0 4px 10px rgba(46, 204, 113, 0.2)",
                }}
                onClick={() => {
                  setIsRecordingInvoice(true);
                  setIsAddingNewProduct(true);
                  setStockSearch("");
                  if (activeStockBrandFilter) {
                    setNewItemState((prev) => ({
                      ...prev,
                      fournisseur: activeStockBrandFilter,
                    }));
                  }
                }}
              >
                {stockTab === "vente"
                  ? " ➕ Nouveau Produit Vente"
                  : " ➕ Nouveau Produit Technique"}
              </button>
            </div>
          </div>
        </div>
        {/* --- FILTRES PAR FOURNISSEUR (STOCK) --- */}
        {(() => {
          const typeToFilterChips =
            stockTab === "vente" ? "retail" : "technical";
          const fournisseurs = Array.from(
            new Set(
              Object.values(catalog)
                .filter(
                  (item) => item.fournisseur && (item.type === typeToFilterChips || item.type === "both" || !item.type),
                )
                .map((item) => item.fournisseur),
            ),
          ).sort((a, b) =>
            a.localeCompare(b, undefined, {
              numeric: true,
              sensitivity: "base",
            }),
          );
          return (
            <div
              style={{
                marginBottom: "20px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#7f8c8d",
                  marginRight: "5px",
                }}
              >
                🏢   FOURNISSEUR :
              </span>
              <button
                className={!activeStockBrandFilter ? "chip active" : "chip"}
                onClick={() => setActiveStockBrandFilter(null)}
                style={{
                  padding: "6px 15px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "11px",
                  backgroundColor: !activeStockBrandFilter ? "#7f8c8d" : "#fff",
                  color: !activeStockBrandFilter ? "white" : "#7f8c8d",
                  border: "1px solid #ddd",
                }}
              >
                TOUT
              </button>
              {fournisseurs.map((f) => (
                <button
                  key={f}
                  className={
                    activeStockBrandFilter === f ? "chip active" : "chip"
                  }
                  onClick={() => setActiveStockBrandFilter(f)}
                  style={{
                    padding: "6px 15px",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "11px",
                    backgroundColor:
                      activeStockBrandFilter === f
                        ? stockTab === "vente"
                          ? "#e67e22"
                          : "#9b59b6"
                        : "#fff",
                    color: activeStockBrandFilter === f ? "white" : "#7f8c8d",
                    border: "1px solid #ddd",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          );
        })()}
        <div
          style={{
            background: "#f8f9fa",
            border: "1px solid #eee",
            padding: "15px",
            borderRadius: "15px",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          <strong> 👤  Astuce :</strong> Modifiez les prix d'
          <strong>Achat (HT)</strong> et de <strong>Vente (TTC)</strong>. Le
          prix de vente se met à jour instantanément dans l'onglet "Vente".
        </div>
        <div
          className="history-list"
          style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                background: "white",
                boxShadow: "0 2px 2px rgba(0,0,0,0.05)",
              }}
            >
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "2px solid #eee",
                  fontSize: "11px",
                  color: "#999",
                  textTransform: "uppercase",
                }}
              >
                <th style={{ padding: "12px", background: "white" }}>
                  Produit
                </th>
                <th style={{ padding: "12px", background: "white" }}>Gamme</th>
                <th style={{ padding: "12px", background: "white" }}>
                  🏢   Fournisseur
                </th>
                <th style={{ padding: "12px", background: "white" }}>
                  Achat (HT)
                </th>
                <th style={{ padding: "12px", background: "white" }}>
                  Vente (TTC)
                </th>
                <th
                  style={{
                    padding: "12px",
                    background: "white",
                    textAlign: "center",
                  }}
                >
                  📦  Entrées
                </th>
                <th
                  style={{
                    padding: "12px",
                    background: "white",
                    textAlign: "center",
                  }}
                >
                  Sorties
                </th>
                <th
                  style={{
                    padding: "12px",
                    background: "white",
                    textAlign: "center",
                  }}
                >
                  Seuil
                </th>
                <th
                  style={{
                    padding: "12px",
                    background: "white",
                    textAlign: "center",
                  }}
                >
                  Stock Actuel
                </th>
                <th
                  style={{
                    padding: "12px",
                    background: "white",
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {allNamesForCount.map((name) => {
                const invItem = invItems.find((i) => i.nom === name);
                const dbItem = catalog[name];
                const qty = invItem?.quantite ?? 0;
                const cEntrees = invItem?.cumulEntrees ?? 0;
                const cSorties = invItem?.cumulSorties ?? 0;
                const sold = getSoldCount(name);
                const handleUpdatePrice = (field, value) => {
                  const val = value === "" ? "" : parseFloat(value);
                  setCatalog((prev) => ({
                    ...prev,
                    [name]: { ...prev[name], [field]: val },
                  }));
                };
                const handleUpdateStock = (field, value) => {
                  const val = value === "" ? "" : parseFloat(value);
                  setInventory((prev) => {
                    const fullList = prev[stockTab] || [];
                    const idx = fullList.findIndex((i) => i.nom === name);
                    let updatedList = [...fullList];
                    if (idx !== -1) {
                      updatedList[idx] = { ...updatedList[idx], [field]: val };
                    } else {
                      updatedList.push({
                        id: Date.now() + Math.random(),
                        nom: name,
                        quantite: field === "quantite" ? val : 0,
                        cumulEntrees: field === "cumulEntrees" ? val : 0,
                        cumulSorties: field === "cumulSorties" ? val : 0,
                        type: typeToFilter,
                      });
                    }
                    return { ...prev, [stockTab]: updatedList };
                  });
                };
                const defaultThreshold = dbItem?.type === "technical" ? 1 : 2;
                const alertThreshold = dbItem?.seuilAlerte ?? defaultThreshold;
                const qtyVal = qty === "" ? 0 : qty;
                const thresholdVal = alertThreshold === "" ? 0 : alertThreshold;
                const isLowStock = qtyVal <= thresholdVal;
                const handleKeyDown = (e) => {
                  e.key === "Enter" && e.target.blur();
                };
                return (
                  <tr
                    key={name}
                    style={{
                      borderBottom: "1px solid #f0f0f0",
                      transition: "background 0.2s",
                      backgroundColor: isLowStock ? "#fff0f0" : "transparent",
                    }}
                    className="stock-row"
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: isLowStock ? "#e74c3c" : "inherit",
                      }}
                    >
                      {isLowStock && (
                        <span style={{ marginRight: "5px" }}>⚠️</span>
                      )}
                      {cleanProductName(name)}
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#999",
                          fontWeight: "normal",
                        }}
                      >
                        {sold > 0 && `Déjà vendu : ${sold}`}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "13px",
                        color: "#666",
                      }}
                    >
                      {dbItem?.gamme || "-"}
                    </td>
                    <td style={{ padding: "8px", fontSize: "13px", minWidth: "180px" }}>
                      <input
                        list="fournisseurs-stock-list"
                        defaultValue={dbItem?.fournisseur || ""}
                        placeholder=" ? Fournisseur..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                        }}
                        onBlur={(e) => {
                          const newVal = e.target.value.trim().toUpperCase();
                          const oldVal = dbItem?.fournisseur || "";
                          if (newVal === oldVal) return;
                          const thisGamme = dbItem?.gamme;
                          // If this product has a gamme, offer to apply to all products of same gamme
                          if (thisGamme && newVal) {
                            const sameGamme = Object.keys(catalog).filter(
                              (k) =>
                                catalog[k].gamme === thisGamme && k !== name,
                            );
                            if (sameGamme.length > 0) {
                              const applyAll = window.confirm(
                                `Appliquer "${newVal}" comme fournisseur à tous les produits de la gamme "${thisGamme}" (${sameGamme.length + 1} produits) ?`,
                              );
                              if (applyAll) {
                                const updates = {};
                                [...sameGamme, name].forEach((k) => {
                                  updates[k] = {
                                    ...catalog[k],
                                    fournisseur: newVal,
                                  };
                                });
                                setCatalog((prev) => ({
                                  ...prev,
                                  ...updates,
                                }));
                                return;
                              }
                            }
                          }
                          // Apply to this product only
                          setCatalog((prev) => ({
                            ...prev,
                            [name]: { ...prev[name], fournisseur: newVal },
                          }));
                        }}
                        style={{
                          width: "120px",
                          padding: "5px 8px",
                          border: "1px solid #e67e22",
                          borderRadius: "5px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#e67e22",
                          background: "#fff9f0",
                          outline: "none",
                          textTransform: "uppercase",
                        }}
                      />
                      <datalist id="fournisseurs-stock-list">
                        {Array.from(
                          new Set(
                            Object.values(catalog)
                              .map((i) => i.fournisseur)
                              .filter(Boolean),
                          ),
                        ).map((f) => (
                          <option key={f} value={f} />
                        ))}
                      </datalist>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <input
                        type="number"
                        step="0.01"
                        value={(dbItem?.prixAchat === undefined || dbItem?.prixAchat === null || dbItem?.prixAchat === "") ? "" : dbItem.prixAchat}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdatePrice("prixAchat", e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => { if (e.target.value === "") handleUpdatePrice("prixAchat", 0); }}
                        style={{
                          width: "65px",
                          padding: "5px",
                          border: "1px solid #eee",
                          borderRadius: "5px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px" }}>
                      {typeToFilter === "retail" ? (
                        <input
                          type="number"
                          step="0.01"
                          value={(dbItem?.prixVente === undefined || dbItem?.prixVente === null || dbItem?.prixVente === "") ? "" : dbItem.prixVente}
                          placeholder="0"
                          onChange={(e) =>
                            handleUpdatePrice("prixVente", e.target.value)
                          }
                          onKeyDown={handleKeyDown}
                          onFocus={(e) => e.target.select()}
                          onBlur={(e) => { if (e.target.value === "") handleUpdatePrice("prixVente", 0); }}
                          style={{
                            width: "65px",
                            padding: "5px",
                            border: "1px solid #eee",
                            borderRadius: "5px",
                            background: "#fff9f0",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#999" }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <input
                        type="number"
                        value={cEntrees === "" ? "" : cEntrees}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateStock("cumulEntrees", e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => { if (e.target.value === "") handleUpdateStock("cumulEntrees", 0); }}
                        style={{
                          width: "50px",
                          padding: "5px",
                          borderRadius: "5px",
                          textAlign: "center",
                          fontSize: "11px",
                          border: "1px solid #eee",
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <input
                        type="number"
                        value={cSorties === "" ? "" : cSorties}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateStock("cumulSorties", e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => { if (e.target.value === "") handleUpdateStock("cumulSorties", 0); }}
                        style={{
                          width: "50px",
                          padding: "5px",
                          borderRadius: "5px",
                          textAlign: "center",
                          fontSize: "11px",
                          border: "1px solid #eee",
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <input
                        type="number"
                        value={alertThreshold === "" ? "" : alertThreshold}
                        placeholder="2"
                        onChange={(e) =>
                          handleUpdatePrice("seuilAlerte", e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => { if (e.target.value === "") handleUpdatePrice("seuilAlerte", 0); }}
                        style={{
                          width: "40px",
                          padding: "5px",
                          borderRadius: "5px",
                          textAlign: "center",
                          fontSize: "11px",
                          border: "1px solid #eee",
                          background: "#fff",
                        }}
                        title="Seuil d'alerte personnalisable"
                      />
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <input
                        type="number"
                        value={qty === "" ? "" : qty}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateStock("quantite", e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => { if (e.target.value === "") handleUpdateStock("quantite", 0); }}
                        style={{
                          width: "50px",
                          padding: "5px",
                          borderRadius: "5px",
                          textAlign: "center",
                          fontWeight: "bold",
                          backgroundColor: isLowStock ? "#ffebee" : "#f8f9fa",
                          color: isLowStock ? "#c0392b" : "inherit",
                          border: isLowStock
                            ? "1px solid #e74c3c"
                            : "1px solid #eee",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        display: "flex",
                        gap: "5px",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      {typeToFilter === "retail" && (
                        <button
                          className="chip"
                          style={{
                            backgroundColor: "#fff3e0",
                            color: "#e67e22",
                            borderColor: "#ffe0b2",
                          }}
                          title="Déstockage Salon (✂️)"
                          onClick={() =>
                            setScannedProductForAction({
                              ...dbItem,
                              nom: name,
                            })
                          }
                        >
                          ✂️
                        </button>
                      )}
                      {isLowStock && (
                        <button
                          className="chip"
                          style={{
                            backgroundColor: "#fff9f0",
                            color: "#e67e22",
                            borderColor: "#e67e22",
                            fontSize: "11px",
                            fontWeight: "bold",
                            padding: "6px 10px",
                          }}
                          title="Ajouter à la commande"
                          onClick={() => {
                            if (pendingOrders.some(o => o.nom === name)) {
                              return alert("📦 Ce produit est déjà dans la liste des commandes.");
                            }
                            setPendingOrders(prev => [
                              ...prev,
                              {
                                id: Date.now(),
                                nom: name,
                                date: new Date().toISOString(),
                                quantite: 1,
                                fournisseur: dbItem?.fournisseur || ""
                              }
                            ]);
                            alert(` ✅ ${cleanProductName(name)} ajouté aux commandes à passer.`);
                          }}
                        >
                          🛒 Commander
                        </button>
                      )}
                      <button
                        className="chip"
                        style={{
                          backgroundColor: "#f0f4f8",
                          color: "#2c3e50",
                          borderColor: "#d1d8e0",
                          fontSize: "11px",
                          fontWeight: "bold",
                          padding: "6px 10px",
                        }}
                        title="Sortie de stock manuelle"
                        onClick={() =>
                          setScannedProductForAction({ ...dbItem, nom: name })
                        }
                      >
                        📦  Déstocker
                      </button>
                      <button
                        className="chip"
                        style={{
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          borderColor: "#bbdefb",
                        }}
                        title="Modifier"
                        onClick={() => startEditStockItem(name)}
                      >
                        ✏️
                      </button>
                      <button
                        className="chip"
                        style={{
                          backgroundColor: "#ffefef",
                          color: "#ff4444",
                          borderColor: "#ffefef",
                        }}
                        onClick={() => {
                          if (
                            window.confirm(`Supprimer ${name} du stock ?`)
                          ) {
                            const itemToDelete = inventory[stockTab].find(
                              (i) => i.nom === name,
                            );
                            const catalogItemToDelete = catalog[name];
                            // Trash logic (Save both if exist)
                            setTrash((t) => ({
                              ...t,
                              inventory: itemToDelete
                                ? [...t.inventory, itemToDelete]
                                : t.inventory,
                              catalog: catalogItemToDelete
                                ? {
                                  ...t.catalog,
                                  [name]: catalogItemToDelete,
                                }
                                : t.catalog,
                            }));
                            // Remove from Inventory
                            setInventory((prev) => ({
                              ...prev,
                              [stockTab]: prev[stockTab].filter(
                                (i) => i.nom !== name,
                              ),
                            }));
                            // Remove from Catalog (GLOBAL)
                            setCatalog((prev) => {
                              const next = { ...prev };
                              delete next[name];
                              return next;
                            });
                            alert(
                              " ✅ Produit Supprimé définitivement (Stock & Catalogue).",
                            );
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  const updateVisits = (id, delta) => {
    if (!id) return;
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, visites: Math.max(0, (c.visites || 0) + delta) }
          : c,
      ),
    );
  };
  const renderClientsTab = () => (
    <div
      style={{
        padding: "20px",
        width: "100%",
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
        flex: 1,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, color: "var(--primary)" }}>
          👤  Fichier Client
        </h2>
        <button
          className="pay-btn"
          style={{ width: "auto", padding: "10px 20px" }}
          onClick={addManualClient}
        >
          + Nouveau Client
        </button>
      </div>
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", pointerEvents: "none", zIndex: 1 }}>🔎</span>
        <input
          className="search-bar"
          placeholder="Rechercher un nom ou un numéro..."
          style={{ paddingLeft: "48px" }}
          onChange={(e) => setClientSearch(e.target.value)}
        />
      </div>
      <div
        className="history-list"
        style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto" }}
      >
        {clients
          .filter((c) => {
            const searchLower = clientSearch.toLowerCase();
            const cleanSearch = clientSearch.replace(/\s/g, "");
            const cleanNum = (c.num || "").replace(/\s/g, "");
            const fullName = `${c.nom || ""} ${c.prenom || ""}`.toLowerCase();
            return (
              fullName.includes(searchLower) ||
              cleanNum.includes(cleanSearch)
            );
          })
          .sort((a, b) => {
            const nameA = `${a.nom || ""} ${a.prenom || ""}`;
            const nameB = `${b.nom || ""} ${b.prenom || ""}`;
            return nameA.localeCompare(nameB);
          })
          .map((c) => (
            <React.Fragment key={c.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {c.nom} {c.prenom}
                    {(() => {
                      const totalV = (c.visites || 0);
                      if (totalV >= 100) return <span style={{ backgroundColor: "#e8f4fd", color: "#00b4d8", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", border: "1px solid #00b4d8" }}>💎 Diamant</span>;
                      if (totalV >= 50) return <span style={{ backgroundColor: "#f0f0f0", color: "#6c757d", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", border: "1px solid #adb5bd", background: "linear-gradient(135deg, #e8e8e8, #d4d4d4)" }}>🏆 Platine</span>;
                      if (totalV >= 30) return <span style={{ backgroundColor: "#fff8e1", color: "#f59e0b", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", border: "1px solid #f59e0b" }}>🥇 Or</span>;
                      if (totalV >= 20) return <span style={{ backgroundColor: "#f5f5f5", color: "#9ca3af", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", border: "1px solid #9ca3af" }}>🥈 Argent</span>;
                      if (totalV > 10) return <span style={{ backgroundColor: "#fff0f6", color: "#cd7f32", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", border: "1px solid #cd7f32" }}>🥉 Bronze</span>;
                      return null;
                    })()}
                  </div>
                  <div style={{ color: "#666", fontSize: "14px" }}>
                    {c.num || "Pas de numéro"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    marginRight: "15px",
                  }}
                >
                  {/* Compteur Coiffure */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#9b59b6",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      ✂️ Coiffure
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <button
                        className="chip"
                        style={{ width: "22px", height: "22px", padding: "0", fontSize: "12px" }}
                        onClick={() => {
                          if (!c.id && !c.nom) return;
                          setClients(prev => prev.map(cl => {
                            const matchById = c.id && cl.id === c.id;
                            const matchByName = !c.id && cl.nom === c.nom && cl.prenom === c.prenom && cl.num === c.num;
                            if (matchById || matchByName) {
                              return {
                                ...cl,
                                visitesCoiffure: Math.max(0, (cl.visitesCoiffure || 0) - 1),
                                visites: Math.max(0, (cl.visites || 0) - 1)
                              };
                            }
                            return cl;
                          }));
                        }}
                      >
                        -
                      </button>
                      <strong
                        style={{
                          fontSize: "16px",
                          minWidth: "20px",
                          color: "#9b59b6",
                        }}
                      >
                        {c.visitesCoiffure || 0}
                      </strong>
                      <button
                        className="chip"
                        style={{ width: "22px", height: "22px", padding: "0", fontSize: "12px" }}
                        onClick={() => {
                          if (!c.id && !c.nom) return;
                          setClients(prev => prev.map(cl => {
                            const matchById = c.id && cl.id === c.id;
                            const matchByName = !c.id && cl.nom === c.nom && cl.prenom === c.prenom && cl.num === c.num;
                            if (matchById || matchByName) {
                              return {
                                ...cl,
                                visitesCoiffure: (cl.visitesCoiffure || 0) + 1,
                                visites: (cl.visites || 0) + 1
                              };
                            }
                            return cl;
                          }));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div
                      style={{
                        width: "50px",
                        height: "4px",
                        background: "#eee",
                        borderRadius: "2px",
                        marginTop: "3px",
                      }}
                    >
                      <div
                        style={{
                          width: `${((c.visitesCoiffure || 0) % 10) * 10}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #9b59b6, #8e44ad)",
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                  </div>
                  {/* Compteur Esthétique */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#e74c3c",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      💄 Esthétique
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <button
                        className="chip"
                        style={{ width: "22px", height: "22px", padding: "0", fontSize: "12px" }}
                        onClick={() => {
                          if (!c.id) return;
                          setClients(prev => prev.map(cl =>
                            cl.id === c.id
                              ? { ...cl, visitesEsthetique: Math.max(0, (cl.visitesEsthetique || 0) - 1), visites: Math.max(0, (cl.visites || 0) - 1) }
                              : cl
                          ));
                        }}
                      >
                        -
                      </button>
                      <strong
                        style={{
                          fontSize: "16px",
                          minWidth: "20px",
                          color: "#e74c3c",
                        }}
                      >
                        {c.visitesEsthetique || 0}
                      </strong>
                      <button
                        className="chip"
                        style={{ width: "22px", height: "22px", padding: "0", fontSize: "12px" }}
                        onClick={() => {
                          if (!c.id) return;
                          setClients(prev => prev.map(cl =>
                            cl.id === c.id
                              ? { ...cl, visitesEsthetique: (cl.visitesEsthetique || 0) + 1, visites: (cl.visites || 0) + 1 }
                              : cl
                          ));
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div
                      style={{
                        width: "50px",
                        height: "4px",
                        background: "#eee",
                        borderRadius: "2px",
                        marginTop: "3px",
                      }}
                    >
                      <div
                        style={{
                          width: `${((c.visitesEsthetique || 0) % 10) * 10}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #e74c3c, #c0392b)",
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="chip"
                    onClick={() => {
                      setClient({ nom: c.nom, prenom: c.prenom || "", num: c.num, id: c.id });
                      setActiveTab("COIFFURE");
                      // Fallback: si pas de compteurs séparés, utiliser le global comme coiffure
                      const coiffCount = c.visitesCoiffure != null ? c.visitesCoiffure : (c.visites || 0);
                      const esthCount = c.visitesEsthetique || 0;
                      const nextCoiff = coiffCount + 1;
                      const nextEsth = esthCount + 1;
                      const isCoiffMilestone = nextCoiff > 1 && nextCoiff % 10 === 0;
                      const isEsthMilestone = esthCount > 0 && nextEsth > 1 && nextEsth % 10 === 0;
                      if (isCoiffMilestone && isEsthMilestone) {
                        setCustomPopup({
                          show: true, type: "alert",
                          title: `🌟 ${nextCoiff}ème visite Coiffure & ${nextEsth}ème visite Esthétique !`,
                          message: `${c.nom} ${c.prenom || ""} atteint ses milestones en Coiffure ET Esthétique ! Choisissez sur quel domaine appliquer la réduction.`,
                        });
                      } else if (isCoiffMilestone) {
                        setRetraitCategory("COIFFURE");
                        setCustomPopup({
                          show: true, type: "alert",
                          title: `✂️ ${nextCoiff}ème visite Coiffure !`,
                          message: `${c.nom} ${c.prenom || ""} arrive à sa ${nextCoiff}ème visite en Coiffure ! Pensez à appliquer une réduction fidélité.`,
                        });
                      } else if (isEsthMilestone) {
                        setRetraitCategory("ESTHÉTIQUE");
                        setCustomPopup({
                          show: true, type: "alert",
                          title: `💄 ${nextEsth}ème visite Esthétique !`,
                          message: `${c.nom} ${c.prenom || ""} arrive à sa ${nextEsth}ème visite en Esthétique ! Pensez à appliquer une réduction fidélité.`,
                        });
                      }
                    }}
                  >
                    👤  Encaisser
                  </button>
                  <button
                    className="chip"
                    style={{
                      backgroundColor: "#f0faff",
                      color: "#3498db",
                      borderColor: "#3498db",
                    }}
                    onClick={() => {
                      if (viewingTechnicalHistoryId === c.id) {
                        setViewingTechnicalHistoryId(null);
                        setIsAddingNewNote(false);
                        setNewNoteText("");
                      } else {
                        setViewingTechnicalHistoryId(c.id);
                      }
                    }}
                  >
                    📋 {" "}
                    {viewingTechnicalHistoryId === c.id
                      ? "Fermer Fiche"
                      : "Fiche Technique"}
                  </button>
                  <button className="chip" onClick={() => editClient(c.id)}>
                    ✏️
                  </button>
                  <button
                    className="chip"
                    style={{
                      backgroundColor: "#ffefef",
                      color: "#ff4444",
                      borderColor: "#ffefef",
                    }}
                    onClick={(e) => { e.stopPropagation(); deleteClient(c.id); }}
                    title="Supprimer définitivement ce client du fichier"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {viewingTechnicalHistoryId === c.id && (
                <div
                  className="animate-in"
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    marginBottom: "20px",
                    padding: "15px",
                    background: "#f9f9f9",
                    borderRadius: "12px",
                    border: "1px solid #eee",
                    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "15px",
                      borderBottom: "2px solid #3498db",
                      paddingBottom: "5px",
                    }}
                  >
                    <h4
                      style={{ margin: 0, fontSize: "16px", color: "#2c3e50" }}
                    >
                      🔄 FICHE TECHNIQUE : {c.nom} {c.prenom}
                    </h4>
                    {!isAddingNewNote && (
                      <button
                        onClick={() => setIsAddingNewNote(true)}
                        style={{
                          background: "#3498db",
                          color: "white",
                          border: "none",
                          borderRadius: "20px",
                          padding: "5px 15px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        + Nouvelle Note
                      </button>
                    )}
                  </div>
                  {isAddingNewNote && (
                    <div
                      style={{
                        marginBottom: "20px",
                        padding: "15px",
                        background: "white",
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #3498db",
                      }}
                    >
                      <h5 style={{ margin: "0 0 10px 0", color: "#3498db" }}>
                        Nouvelle Note (aujourd'hui)
                      </h5>
                      <textarea
                        autoFocus
                        placeholder=" Écrivez ici la nouvelle recette ou note technique..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        style={{
                          width: "100%",
                          minHeight: "100px",
                          padding: "10px",
                          fontSize: "14px",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          outline: "none",
                          fontFamily: "inherit",
                          resize: "vertical",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "10px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          onClick={() => {
                            if (newNoteText.trim()) {
                              const note = {
                                date: new Date().toISOString().split("T")[0],
                                note: newNoteText.trim(),
                              };
                              setClients((prev) =>
                                prev.map((cl) =>
                                  cl.id === c.id
                                    ? {
                                      ...cl,
                                      notesTechniques: [
                                        note,
                                        ...(cl.notesTechniques || []),
                                      ],
                                    }
                                    : cl,
                                ),
                              );
                              setNewNoteText("");
                              setIsAddingNewNote(false);
                            }
                          }}
                          style={{
                            background: "#2ecc71",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "6px 15px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingNewNote(false);
                            setNewNoteText("");
                          }}
                          style={{
                            background: "#bdc3c7",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "6px 15px",
                            cursor: "pointer",
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                  {c.notesTechniques && c.notesTechniques.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {c.notesTechniques.map((n, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px",
                            background: "white",
                            borderLeft: "4px solid #3498db",
                            borderRadius: "8px",
                            position: "relative",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "8px",
                            }}
                          >
                            <strong
                              style={{ fontSize: "13px", color: "#3498db" }}
                            >
                              {n.date.split("-").reverse().join("/")}
                            </strong>
                            <div style={{ display: "flex", gap: "10px" }}>
                              {editingNoteIndex === i ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setClients((prev) =>
                                        prev.map((cl) =>
                                          cl.id === c.id
                                            ? {
                                              ...cl,
                                              notesTechniques:
                                                cl.notesTechniques.map(
                                                  (nt, idx) =>
                                                    idx === i
                                                      ? {
                                                        ...nt,
                                                        note: editingNoteText,
                                                      }
                                                      : nt,
                                                ),
                                            }
                                            : cl,
                                        ),
                                      );
                                      setEditingNoteIndex(null);
                                    }}
                                    style={{
                                      background: "#2ecc71",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "11px",
                                      padding: "3px 10px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Sauvegarder
                                  </button>
                                  <button
                                    onClick={() => setEditingNoteIndex(null)}
                                    style={{
                                      background: "#bdc3c7",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "11px",
                                      padding: "3px 10px",
                                    }}
                                  >
                                    Annuler
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingNoteIndex(i);
                                      setEditingNoteText(n.note);
                                    }}
                                    style={{
                                      background: "#f8f9fa",
                                      border: "1px solid #ddd",
                                      borderRadius: "4px",
                                      padding: "4px 8px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                    }}
                                    title="Modifier"
                                  >
                                    ✏️ Modifier
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Supprimer cette note technique ?",
                                        )
                                      ) {
                                        setClients((prev) =>
                                          prev.map((cl) =>
                                            cl.id === c.id
                                              ? {
                                                ...cl,
                                                notesTechniques:
                                                  cl.notesTechniques.filter(
                                                    (_, idx) => idx !== i,
                                                  ),
                                              }
                                              : cl,
                                          ),
                                        );
                                      }
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                    }}
                                    title="Supprimer"
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {editingNoteIndex === i ? (
                            <textarea
                              value={editingNoteText}
                              onChange={(e) =>
                                setEditingNoteText(e.target.value)
                              }
                              style={{
                                width: "100%",
                                minHeight: "100px",
                                padding: "10px",
                                fontSize: "14px",
                                borderRadius: "8px",
                                border: "1px solid #3498db",
                                outline: "none",
                                fontFamily: "inherit",
                                resize: "vertical",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                fontSize: "15px",
                                color: "#2d3436",
                                whiteSpace: "pre-wrap",
                                lineHeight: "1.5",
                                padding: "5px 0",
                              }}
                            >
                              {n.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#999",
                        padding: "40px",
                        fontStyle: "italic",
                        background: "white",
                        borderRadius: "12px",
                        border: "1px dashed #ddd",
                      }}
                    >
                      Aucun historique technique pour ce client.
                      <br />
                      <button
                        onClick={() => setIsAddingNewNote(true)}
                        style={{
                          marginTop: "10px",
                          background: "none",
                          border: "1px solid #3498db",
                          color: "#3498db",
                          padding: "5px 15px",
                          borderRadius: "20px",
                          cursor: "pointer",
                        }}
                      >
                        Créer la première note
                      </button>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        {clients.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Aucun client dans la base. Encaissez un client pour l'ajouter
            automatiquement ou utilisez le bouton + pour l'ajouter manuellement.
          </div>
        )}
      </div>
    </div>
  );
  const renderTrashTab = () => {
    const isEmpty =
      Object.keys(trash.catalog).length === 0 &&
      trash.clients.length === 0 &&
      trash.inventory.length === 0 &&
      (!trash.transactions || trash.transactions.length === 0);
    const restoreCatalogItem = (name) => {
      setCatalog((prev) => ({ ...prev, [name]: trash.catalog[name] }));
      setTrash((prev) => {
        const newCat = { ...prev.catalog };
        if (newCat[name]) delete newCat[name];
        return { ...prev, catalog: newCat };
      });
      alert(" ✅  Élément restauré !");
    };
    const restoreClient = (index) => {
      const client = trash.clients[index];
      setClients((prev) => [...prev, client]);
      setTrash((prev) => ({
        ...prev,
        clients: prev.clients.filter((_, i) => i !== index),
      }));
      alert(" ✅ Client restauré !");
    };
    const restoreInventory = (index) => {
      const item = trash.inventory[index];
      const type = catalog[item.nom]?.type === "retail" ? "vente" : "technique";
      setInventory((prev) => ({
        ...prev,
        [type]: [...prev[type], item],
      }));
      setTrash((prev) => ({
        ...prev,
        inventory: prev.inventory.filter((_, i) => i !== index),
      }));
      alert(" ✅ Stock restauré !");
    };
    const restoreTransaction = (index) => {
      const trans = trash.transactions[index];
      setHistory((prev) => [...prev, trans]);
      setTrash((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((_, i) => i !== index),
      }));
      alert(" ✅ Transaction restaurée dans l'historique !");
    };
    const emptyTrash = () => {
      const performEmpty = () => {
        setTrash({ catalog: {}, clients: [], inventory: [], transactions: [] });
        alert(" ✅ Corbeille vidée.");
      };
      if (isAuthenticated) {
        performEmpty();
      } else {
        requestAccess("VIDER LA CORBEILLE DÉFINITIVEMENT ?", performEmpty);
      }
    };
    return (
      <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "#e74c3c", margin: 0 }}>
            🗑️ Corbeille (Mode Sécurisé Maman)
          </h2>
          {!isEmpty && (
            <button
              className="pay-btn"
              style={{ background: "#e74c3c", width: "auto", margin: 0 }}
              onClick={emptyTrash}
            >
              Vider la corbeille
            </button>
          )}
        </div>
        {isEmpty ? (
          <div style={{ textAlign: "center", padding: "100px", color: "#999" }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}> 🗑️ </div>
            <p style={{ fontSize: "18px" }}>La corbeille est vide.</p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {/* SECTION CATALOGUE */}
            {trash.catalog && Object.keys(trash.catalog).length > 0 && (
              <div
                style={{
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: "1px solid #eee",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    color: "#7f8c8d",
                    marginBottom: "15px",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "5px",
                  }}
                >
                  💇‍♂️ Services & Catalogue
                </h3>
                {Object.keys(trash.catalog).map((name) => (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #f9f9f9",
                    }}
                  >
                    <span style={{ fontWeight: "500" }}>
                      {name} ({trash.catalog[name].prixVente}€)
                    </span>
                    <button
                      className="chip"
                      style={{
                        background: "#2ecc71",
                        color: "white",
                        border: "none",
                      }}
                      onClick={() => restoreCatalogItem(name)}
                    >
                      Restaurer
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* SECTION CLIENTS */}
            {trash.clients && trash.clients.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: "1px solid #eee",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    color: "#7f8c8d",
                    marginBottom: "15px",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "5px",
                  }}
                >
                  👤  Clients Supprimés
                </h3>
                {trash.clients.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #f9f9f9",
                    }}
                  >
                    <span style={{ fontWeight: "500" }}>
                      {c.nom} ({c.num})
                    </span>
                    <button
                      className="chip"
                      style={{
                        background: "#2ecc71",
                        color: "white",
                        border: "none",
                      }}
                      onClick={() => restoreClient(i)}
                    >
                      Restaurer
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* SECTION STOCKS */}
            {trash.inventory && trash.inventory.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: "1px solid #eee",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    color: "#7f8c8d",
                    marginBottom: "15px",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "5px",
                  }}
                >
                  📦  Stocks / Inventaire
                </h3>
                {trash.inventory.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #f9f9f9",
                    }}
                  >
                    <span style={{ fontWeight: "500" }}>
                      {item.nom} (Quantité: {item.quantite})
                    </span>
                    <button
                      className="chip"
                      style={{
                        background: "#2ecc71",
                        color: "white",
                        border: "none",
                      }}
                      onClick={() => restoreInventory(i)}
                    >
                      Restaurer
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* SECTION TRANSACTIONS */}
            {trash.transactions && trash.transactions.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: "1px solid #ffeeee",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    color: "#e74c3c",
                    marginBottom: "15px",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #ffeeee",
                    paddingBottom: "5px",
                  }}
                >
                  🛒   Suppression Excel (Historique)
                </h3>
                {trash.transactions.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #fff5f5",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "14px",
                          color: "#2d3436",
                        }}
                      >
                        {t.Nom_Client || "Passant"} - {t.Total.toFixed(2)}€                      </div>
                      <div style={{ fontSize: "11px", color: "#999" }}>
                        Supprimé le : {new Date(t.deletedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="chip"
                      style={{
                        background: "#2ecc71",
                        color: "white",
                        border: "none",
                      }}
                      onClick={() => restoreTransaction(i)}
                    >
                      Restaurer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  const renderMissionsTab = () => {
    const handleAddMission = () => {
      requestAccess("AJOUTER UNE NOUVELLE MISSION ?", () => {
        setNewMissionData({ titre: "", description: "", attribueeA: "" });
        setShowAddMissionModal(true);
      });
    };
    const submitNewMission = () => {
      if (newMissionData.titre.trim()) {
        setMissions((prev) => [
          {
            id: Date.now(),
            titre: newMissionData.titre,
            description: newMissionData.description || "",
            statut: "EN_COURS",
            date: new Date().toISOString(),
            creePar: "Patronne",
            attribueeA: newMissionData.attribueeA || "Toute l'équipe",
          },
          ...prev,
        ]);
        setShowAddMissionModal(false);
        setNewMissionData({ titre: "", description: "", attribueeA: "" });
      } else {
        alert("Veuillez entrer au moins un titre.");
      }
    };
    const markAsDone = (id, staffName) => {
      const staff = staffName;
      if (!staff) return;
      const cleanStaff = staff.trim();
      if (!STAFF_NAMES.includes(cleanStaff)) {
        return alert("❌ Nom d'employé invalide. Veuillez choisir parmi : " + STAFF_NAMES.join(", "));
      }
      setMissions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, statut: "A_VERIFIER", faitPar: cleanStaff } : m)),
      );
      alert(
        ` ✅ Mission marquée comme FAITE par ${cleanStaff} ! La patronne doit maintenant la valider.`,
      );
    };
    const verifyMission = (id) => {
      const mission = missions.find(m => m.id === id);
      const defaultStaff = mission?.faitPar || "";

      requestAccess(`VALIDER ET ARCHIVER CETTE MISSION ? (Réalisée par : ${defaultStaff})`, () => {
        setMissions((prev) =>
          prev.map((m) => (m.id === id ? { ...m, statut: "ARCHIVE" } : m)),
        );
        alert("🎉 Mission validée et Archivée !");
      });
    };
    const deleteMission = (id) => {
      requestAccess("SuppriméR DÉFINITIVEMENT CETTE MISSION ?", () => {
        setMissions((prev) => prev.filter((m) => m.id !== id));
      });
    };
    const filteredMissions = missions.filter((m) =>
      activeMissionTab === "EN_COURS"
        ? m.statut !== "ARCHIVE"
        : m.statut === "ARCHIVE",
    );
    return (
      <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "#9b59b6", margin: 0 }}>
            🎯 Missions & Objectifs Salon
          </h2>
          <button
            className="pay-btn"
            style={{
              width: "auto",
              background: "linear-gradient(135deg, #9b59b6, #8e44ad)",
              margin: 0,
            }}
            onClick={handleAddMission}
          >
            ➕ Nouvelle Mission (Patronne)
          </button>
        </div>
        <div className="sub-tabs" style={{ marginBottom: "20px" }}>
          <button
            className={`sub-tab ${activeMissionTab === "EN_COURS" ? "active" : ""}`}
            style={{
              flex: 1,
              borderColor: "#9b59b6",
              color: activeMissionTab === "EN_COURS" ? "white" : "#9b59b6",
              backgroundColor:
                activeMissionTab === "EN_COURS" ? "#9b59b6" : "transparent",
            }}
            onClick={() => setActiveMissionTab("EN_COURS")}
          >
            📋 En Cours ({missions.filter((m) => m.statut !== "ARCHIVE").length}
            )
          </button>
          <button
            className={`sub-tab ${activeMissionTab === "ARCHIVES" ? "active" : ""}`}
            style={{
              flex: 1,
              borderColor: "#7f8c8d",
              color: activeMissionTab === "ARCHIVES" ? "white" : "#7f8c8d",
              backgroundColor:
                activeMissionTab === "ARCHIVES" ? "#7f8c8d" : "transparent",
            }}
            onClick={() => setActiveMissionTab("ARCHIVES")}
          >
            ✅ Archivées (
            {missions.filter((m) => m.statut === "ARCHIVE").length})
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {filteredMissions.map((m) => (
            <div
              key={m.id}
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "15px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                borderLeft: `6px solid ${m.statut === "A_VERIFIER" ? "#f1c40f" : m.statut === "ARCHIVE" ? "#2ecc71" : "#9b59b6"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "5px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#2c3e50" }}>
                    {m.titre}
                  </h3>
                  {m.statut === "A_VERIFIER" && (
                    <span
                      style={{
                        background: "#f1c40f",
                        color: "white",
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      📋 À VÉRIFIER
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: "0 0 10px 0",
                    color: "#7f8c8d",
                    fontSize: "14px",
                  }}
                >
                  {m.description}
                </p>
                <div style={{ fontSize: "11px", color: "#666", marginTop: "5px" }}>
                  📅 Créée le {new Date(m.date).toLocaleDateString()}
                  {m.creePar && <span style={{ marginLeft: "10px", color: "#9b59b6", fontWeight: "bold" }}> 👤 Créée par : {m.creePar}</span>}
                  <span style={{ marginLeft: "10px", color: "#e67e22", fontWeight: "bold" }}> 🎯 Attribuée à : {m.attribueeA || "Toute l'équipe"}</span>
                  {(m.faitPar || m.statut === "ARCHIVE") && (
                    <div style={{ marginTop: "3px", color: "#2ecc71", fontWeight: "bold" }}>
                      ✅ RÉALISÉE PAR : {m.faitPar || "Inconnu"}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {m.statut === "EN_COURS" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", justifyContent: "flex-end", maxWidth: "250px" }}>
                    <span style={{ fontSize: "10px", width: "100%", color: "#9b59b6", fontWeight: "bold", textAlign: "right", marginBottom: "3px" }}>QUI RÉALISE ?</span>
                    {STAFF_NAMES.map(s => (
                      <button
                        key={s}
                        onClick={() => markAsDone(m.id, s)}
                        style={{
                          background: "#9b59b6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          transition: "opacity 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {m.statut === "A_VERIFIER" && (
                  <button
                    onClick={() => verifyMission(m.id)}
                    style={{
                      background: "#2ecc71",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 15px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    ✅ Valider (Patronne)
                  </button>
                )}
                <button
                  onClick={() => deleteMission(m.id)}
                  style={{
                    background: "none",
                    border: "1px solid #ff7675",
                    color: "#ff7675",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {filteredMissions.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#bdc3c7",
                padding: "40px",
                fontStyle: "italic",
                background: "white",
                borderRadius: "15px",
                border: "2px dashed #eee",
              }}
            >
              Aucune mission dans cette Catégorie.
            </div>
          )}
        </div>
        {showAddMissionModal && (
          <div className="modal-overlay">
            <div className="modal-content mission-form-modal">
              <h3> 🎯 Nouvelle Mission</h3>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Titre
                </label>
                <input
                  type="text"
                  placeholder="EX: NETTOYAGE BACS, INVENTAIRE STOCK..."
                  value={newMissionData.titre}
                  onChange={(e) =>
                    setNewMissionData({
                      ...newMissionData,
                      titre: e.target.value.toUpperCase(),
                    })
                  }
                  style={{ textTransform: "uppercase" }}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Description (Optionnel)
                </label>
                <textarea
                  placeholder="DÉTAILS DE LA MISSION..."
                  value={newMissionData.description}
                  onChange={(e) =>
                    setNewMissionData({
                      ...newMissionData,
                      description: e.target.value.toUpperCase(),
                    })
                  }
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    fontFamily: "inherit",
                    textTransform: "uppercase",
                  }}
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Attribuer à (Optionnel)
                </label>
                <select
                  value={newMissionData.attribueeA || ""}
                  onChange={(e) =>
                    setNewMissionData({
                      ...newMissionData,
                      attribueeA: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    fontFamily: "inherit",
                    fontSize: "14px",
                    background: "white",
                  }}
                >
                  <option value="">-- Toute l'équipe --</option>
                  <option value="Toute l'équipe">Toute l'équipe</option>
                  <option value="Florence">Florence</option>
                  <option value="Magalie">Magalie</option>
                  <option value="Manon">Manon</option>
                  <option value="Aude">Aude</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="pay-btn"
                  style={{ background: "#7f8c8d" }}
                  onClick={() => setShowAddMissionModal(false)}
                >
                  ANNULER
                </button>
                <button
                  className="pay-btn"
                  style={{
                    background: "linear-gradient(135deg, #9b59b6, #8e44ad)",
                  }}
                  onClick={submitNewMission}
                >
                  CRÉER LA MISSION
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  const renderArchivesTab = () => {
    const getMonthDays = (monthKey) => {
      if (!monthKey || typeof monthKey !== "string") return [];
      const [y, m] = monthKey.split("-").map((x) => parseInt(x, 10));
      if (!y || !m) return [];
      const numDays = new Date(y, m, 0).getDate();
      return Array.from({ length: numDays }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        return `${monthKey}-${d}`;
      });
    };
    const getDayTotals = (dayData) => {
      const totals = {
        total: 0,
        cb: 0,
        esp: 0,
        chq: 0,
        cadeau: 0,
        remise: 0,
      };
      (dayData || []).forEach((t) => {
        totals.total += Number(t.Total) || 0;
        totals.cb += Number(t.Enc_CB) || 0;
        totals.esp += Number(t.Enc_Esp) || 0;
        totals.chq += Number(t.Enc_Chq) || 0;
        totals.cadeau += Number(t.Enc_Cadeau) || 0;
        totals.remise += Number(t.Remise) || 0;
      });
      return totals;
    };
    const Archivéentries = Object.entries(archives || {}).map(
      ([month, data]) => ({
        month,
        data,
      }),
    );
    return (
      <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
        <h2 style={{ color: "var(--primary)", marginBottom: "20px" }}>
          📚 Historique des Archives Mensuelles
        </h2>
        {activeArchiveMonth && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeeba",
              borderRadius: "15px",
              padding: "15px",
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ fontWeight: "bold", color: "#856404" }}>
              Mode archive actif : {activeArchiveMonth}
            </div>
            <button
              className="pay-btn"
              style={{ width: "auto", background: "#e67e22", margin: 0 }}
              onClick={exitArchiveMonth}
            >
              🔄 Retour au présent
            </button>
          </div>
        )}
        {Archivéentries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px", color: "#999" }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}> 📦 </div>
            <p style={{ fontSize: "18px" }}>Aucune archive pour le moment.</p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {Archivéentries
              .sort((a, b) => b.month.localeCompare(a.month))
              .map((arc, i) => (
                <div
                  key={i}
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "15px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                    borderLeft: "6px solid var(--primary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#2c3e50",
                        }}
                      >
                        {(() => {
                          const [y, m] = arc.month.split("-");
                          const monthsFr = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
                          return `Mois de ${monthsFr[parseInt(m, 10) - 1]} ${y}`;
                        })()}
                      </h3>
                      <div style={{ fontSize: "12px", color: "#7f8c8d" }}>
                        📦  {(arc.data || []).length} transactions  |  ⏳ Dernière mise à jour le{" "}
                        {arc.archivedAt
                          ? new Date(arc.archivedAt).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="pay-btn"
                        style={{
                          width: "auto",
                          background: "#7f8c8d",
                          margin: 0,
                        }}
                        onClick={() => {
                          setExpandedArchiveMonth((prev) =>
                            prev === arc.month ? null : arc.month,
                          );
                          setExpandedArchiveDay(null);
                        }}
                      >
                        {expandedArchiveMonth === arc.month
                          ? " ➖ Réduire"
                          : " ➕ Détails"}
                      </button>
                      <button
                        className="pay-btn"
                        style={{
                          width: "auto",
                          background: "#2ecc71",
                          margin: 0,
                        }}
                        onClick={() => enterArchiveMonth(arc.month)}
                      >
                        📂 Ouvrir ce mois
                      </button>
                    </div>
                  </div>
                  {expandedArchiveMonth === arc.month && (
                    <div style={{ marginTop: "15px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#7f8c8d",
                          marginBottom: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        📅 Jours du mois
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginBottom: "15px",
                        }}
                      >
                        {getMonthDays(arc.month).map((dayKey) => {
                          const dayCount = (arc.data || []).filter(
                            (t) => t && normalizeDate(t.Date) === dayKey,
                          ).length;
                          const isActive = expandedArchiveDay === dayKey;
                          return (
                            <button
                              key={dayKey}
                              className="pay-btn"
                              style={{
                                width: "auto",
                                margin: 0,
                                padding: "8px 10px",
                                background: isActive
                                  ? "var(--primary)"
                                  : dayCount > 0
                                    ? "#f8f9fa"
                                    : "#ecf0f1",
                                color: isActive
                                  ? "white"
                                  : dayCount > 0
                                    ? "#2c3e50"
                                    : "#95a5a6",
                                border:
                                  dayCount > 0
                                    ? "1px solid #ddd"
                                    : "1px solid #eee",
                                cursor: dayCount > 0 ? "pointer" : "not-allowed",
                                opacity: dayCount > 0 ? 1 : 0.7,
                              }}
                              onClick={() => {
                                if (dayCount === 0) return;
                                setExpandedArchiveDay((prev) =>
                                  prev === dayKey ? null : dayKey,
                                );
                              }}
                            >
                              {dayKey.slice(-2)}
                              {dayCount > 0 ? ` (${dayCount})` : ""}
                            </button>
                          );
                        })}
                      </div>
                      {expandedArchiveDay && (
                        <div
                          style={{
                            background: "#f8f9ff",
                            border: "1px solid #e6e8ff",
                            borderRadius: "15px",
                            padding: "15px",
                          }}
                        >
                          {(() => {
                            const dayRaw = (arc.data || [])
                              .filter((t) => t && normalizeDate(t.Date) === expandedArchiveDay);

                            // Déduplication par ID au cas où
                            const dayUnique = [];
                            const seenIds = new Set();
                            dayRaw.forEach(t => {
                              if (t && t.id && !seenIds.has(t.id)) {
                                seenIds.add(t.id);
                                dayUnique.push(t);
                              }
                            });

                            const dayData = dayUnique.slice().sort((a, b) => (b.Heure || "").localeCompare(a.Heure || ""));
                            const totals = getDayTotals(dayData);
                            return (
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "10px",
                                    marginBottom: "10px",
                                  }}
                                >
                                  <div style={{ fontWeight: "bold" }}>
                                    📄 Détail du {expandedArchiveDay}
                                  </div>
                                  <div style={{ fontWeight: "bold" }}>
                                    Total: {totals.total.toFixed(2)} €                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "10px",
                                    fontSize: "12px",
                                    marginBottom: "12px",
                                  }}
                                >
                                  <div>CB: {totals.cb.toFixed(2)}€ </div>
                                  <div>Esp: {totals.esp.toFixed(2)}€ </div>
                                  <div>Chq: {totals.chq.toFixed(2)}€ </div>
                                  <div>Cadeau: {totals.cadeau.toFixed(2)}€ </div>
                                  <div>Remise: {totals.remise.toFixed(2)} %</div>
                                </div>
                                {dayData.length === 0 ? (
                                  <div style={{ color: "#7f8c8d" }}>
                                    Aucune transaction.
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "10px",
                                    }}
                                  >
                                    {dayData.map((t) => (
                                      <div
                                        key={t.id}
                                        style={{
                                          background: "white",
                                          borderRadius: "12px",
                                          border: "1px solid #eee",
                                          padding: "12px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: "10px",
                                          }}
                                        >
                                          <div style={{ fontWeight: "bold" }}>
                                            {t.Nom_Client || "(sans nom)"}
                                          </div>
                                          <div style={{ fontWeight: "bold" }}>
                                            {(Number(t.Total) || 0).toFixed(2)} €                                          </div>
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            color: "#7f8c8d",
                                            marginTop: "4px",
                                          }}
                                        >
                                          {t.Catégorie}  💆‍♀️ {t.caissiere || "(non renseigné)"}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            marginTop: "8px",
                                          }}
                                        >
                                          {t && Array.isArray(t.items_names) && t.items_names.length > 0
                                            ? t.items_names.join(" • ")
                                            : t.Détails}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };
  const currentFilters =
    activeTab === "COIFFURE"
      ? availableFilters.COIFFURE
      : activeTab === "ESTHÉTIQUE"
        ? availableFilters.ESTHETIQUE
        : activeTab === "VENTE"
          ? availableFilters.VENTE
          : [];
  // --- GARDE-BARRIÈRE DRIVE (OBLIGATOIRE) ---
  // if (!fileHandle || !isDriveInitialized) { return renderDriveGatekeeper(); }

  // GLOBAL SAFETY GUARDS for large derived data usage below
  const safeHistory = Array.isArray(history) ? history : [];
  const safeCatalog = (catalog && typeof catalog === 'object') ? catalog : {};
  const safeInventory = inventory || { vente: [], technique: [] };
  const safeArchives = (archives && typeof archives === 'object' && !Array.isArray(archives)) ? archives : {};
  const safeTrash = (trash && typeof trash === 'object' && !Array.isArray(trash)) ? trash : { catalog: {}, clients: [], inventory: [] };

  return (
    <div className="app-container">
      {/* BANNIERE RECONNEXION DRIVE */}
      {fileHandle && (!isDriveInitialized || isDriveVerifying) && (
        <div
          style={{
            background: "#e74c3c",
            color: "white",
            padding: "15px",
            textAlign: "center",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 100000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "15px"
          }}
          onClick={verifyDrivePermission}
        >
          <span> ⚠️ Reconnexion au fichier de sauvegarde requise par le navigateur.</span>
          <button
            style={{
              background: "white",
              color: "#e74c3c",
              border: "none",
              padding: "8px 15px",
              borderRadius: "5px",
              fontWeight: "bold",
              cursor: "pointer",
              pointerEvents: "none"
            }}
          >
            🔄 Cliquez ici pour rétablir
          </button>
        </div>
      )}
      <PasswordModal />
      {/* MODAL ALERTES STOCK BAS */}
      {showLowStockModal && (
        <div
          className="modal-overlay"
          style={{ zIndex: 100001 }}
          onClick={() => setShowLowStockModal(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: "900px", width: "95%", padding: "0", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "#e74c3c",
                color: "white",
                padding: "20px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowLowStockModal(false)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  fontSize: "20px",
                  cursor: "pointer",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                ✕
              </button>
              <h2 style={{ margin: 0, fontSize: "24px" }}>🔔 ALERTES STOCK</h2>
              <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
                Produits arrivant à épuisement ({lowStockItems.length})
              </p>
            </div>
            {/* FILTRES PAR FOURNISSEUR — identiques aux onglets Stock */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #eee", display: "flex", flexWrap: "wrap", gap: "6px", background: "#fafafa" }}>
              <button
                className="chip"
                style={{
                  background: lowStockFilter === "Tous" ? "#e74c3c" : "#f0f0f0",
                  color: lowStockFilter === "Tous" ? "white" : "#666",
                  borderColor: lowStockFilter === "Tous" ? "#e74c3c" : "#ddd",
                  padding: "6px 14px", fontSize: "12px", fontWeight: "bold",
                }}
                onClick={() => setLowStockFilter("Tous")}
              >
                Tous ({lowStockItems.length})
              </button>
              {(() => {
                // Extraire tous les fournisseurs uniques du catalogue (retail + technical)
                const safeCat = (catalog && typeof catalog === 'object') ? catalog : {};
                const allFournisseurs = [...new Set(
                  Object.values(safeCat)
                    .filter(it => it && (it.type === "retail" || it.type === "technical" || it.type === "both"))
                    .map(it => it.fournisseur || "Inconnu")
                )].sort();
                return allFournisseurs.map(f => {
                  const count = lowStockItems.filter(it => (it.fournisseur || "Inconnu") === f).length;
                  return (
                    <button
                      key={f}
                      className="chip"
                      style={{
                        background: lowStockFilter === f ? "#e74c3c" : "#f0f0f0",
                        color: lowStockFilter === f ? "white" : "#666",
                        borderColor: lowStockFilter === f ? "#e74c3c" : "#ddd",
                        padding: "6px 14px", fontSize: "12px",
                        opacity: count > 0 ? 1 : 0.5,
                      }}
                      onClick={() => setLowStockFilter(f)}
                    >
                      {f} {count > 0 ? `(${count})` : ""}
                    </button>
                  );
                });
              })()}
            </div>
            <div
              style={{ padding: "20px", maxHeight: "70vh", overflowY: "auto" }}
            >
              {(() => {
                const filtered = lowStockFilter === "Tous"
                  ? lowStockItems
                  : lowStockItems.filter(it => (it.fournisseur || "Inconnu") === lowStockFilter);
                return filtered.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {filtered.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          background: "#fff9f9",
                          borderRadius: "10px",
                          border: "1px solid #ffeded",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", color: "#2d3436" }}>
                            {item.nom}
                          </div>
                          <div style={{ fontSize: "11px", color: "#999" }}>
                            🏭 {item.fournisseur} {item.filtre ? `• ${item.filtre}` : ""}
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "right",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#e74c3c",
                              }}
                            >
                              {item.quantite}
                            </div>
                            <div style={{ fontSize: "10px", color: "#e74c3c" }}>
                              sur {item.seuil}
                            </div>
                          </div>
                          <button
                            className="chip"
                            style={{
                              backgroundColor: "#fff9f0",
                              color: "#e67e22",
                              borderColor: "#e67e22",
                              fontSize: "10px",
                              fontWeight: "bold",
                              padding: "6px 10px",
                              whiteSpace: "nowrap"
                            }}
                            title="Ajouter à la commande"
                            onClick={() => {
                              if (pendingOrders.some(o => o.nom === item.nom)) {
                                return alert("📦 Ce produit est déjà dans la liste des commandes.");
                              }
                              setPendingOrders(prev => [
                                ...prev,
                                {
                                  id: Date.now(),
                                  nom: item.nom,
                                  date: new Date().toISOString(),
                                  quantite: 1,
                                  fournisseur: item.fournisseur || ""
                                }
                              ]);
                              alert(` ✅ ${item.nom} ajouté aux commandes.`);
                            }}
                          >
                            🛒 Commander
                          </button>
                          <button
                            className="chip"
                            style={{
                              background: "#3498db",
                              color: "white",
                              borderColor: "#3498db",
                              padding: "8px",
                              fontSize: "14px",
                            }}
                            title="Modifier"
                            onClick={() => {
                              setShowLowStockModal(false);
                              setActiveTab("STOCKS");
                              startEditStockItem(item.nom);
                            }}
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#ccc",
                    }}
                  >
                    <div style={{ fontSize: "48px", marginBottom: "10px" }}>
                      🎉
                    </div>
                    <p>Tous vos stocks sont au top !</p>
                  </div>
                );
              })()}
            </div>
            <div
              style={{
                padding: "20px",
                background: "#f8f9fa",
                borderTop: "1px solid #eee",
                textAlign: "center",
              }}
            >
              <button
                className="pay-btn"
                style={{ background: "#2d3436", margin: 0, width: "100%" }}
                onClick={() => {
                  setShowLowStockModal(false);
                  setActiveTab("STOCKS");
                }}
              >
                GÉRER MES STOCKS
              </button>
            </div>
          </div>
        </div>
      )}
      {/* REMOTE SCANNER OVERLAY (IF ENABLED) */}
      {isMobile && !isRemoteScanner && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
          }}
        >
          <button
            onClick={() => {
              const protocol = window.location.protocol;
              const currentPort = window.location.port;
              if (peerId)
                window.location.href = `${protocol}//${scannerIp.replace(/\s+/g, "")}:${currentPort}?mode=scanner&peerId=${peerId}#scanner?peerId=${peerId}`;
              else
                alert("Initialisation en cours, réessayez dans 2 secondes...");
            }}
            style={{
              padding: "15px 25px",
              borderRadius: "50px",
              background: "#00bfff",
              color: "white",
              fontWeight: "bold",
              border: "none",
              boxShadow: "0 5px 20px rgba(0,191,255,0.4)",
              fontSize: "16px",
            }}
          >
            🚀 ACTIVER MODE SCANNER
          </button>
          {/* HELP TEXT FOR URL */}
          <div
            style={{
              textAlign: "center",
              marginTop: "10px",
              color: "white",
              fontSize: "10px",
              background: "rgba(0,0,0,0.5)",
              padding: "5px",
              borderRadius: "5px",
            }}
          >
          </div>
        </div>
      )}
      {/* HEADER TABS */}
      <div className="tabs-header">
        {[
          { id: "COIFFURE", icon: "💇‍♂️" },
          { id: "ESTHÉTIQUE", icon: "💄" },
          { id: "VENTE", icon: "🛍️" },
          { id: "CLIENTS", icon: "👤" },
          { id: "MISSIONS", icon: "🚀" },
          { id: "STOCKS", icon: "📦" },
          { id: "EXCEL", icon: "🖨️" },
          { id: "HISTORIQUE DES ARCHIVES", icon: "📜" },
          { id: "CORBEILLE", icon: "🗑️" },
        ].map((t) => (
          <button
            key={t.id}
            className={`${activeTab === t.id ? "tab active" : "tab"} ${t.id === "MISSIONS" && hasPendingMissions ? "blink-mission-alert" : ""}`}
            onClick={() => handleTabClick(t.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 5px",
              height: "auto",
              flex: 1, // Prend toute la place disponible
              minWidth: "0", // Permet de r tr cir si besoin
              transition: "all 0.3s ease",
            }}
          >
            <span style={{ fontSize: "24px", marginBottom: "5px" }}>
              {t.icon}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {t.id}
            </span>
          </button>
        ))}
        {renderSyncIndicator()}
        {/* CLOCHE DE NOTIFICATION STOCK */}
        <div
          onClick={() => setShowLowStockModal(true)}
          style={{
            alignSelf: "center",
            position: "relative",
            marginLeft: "auto",
            marginRight: "20px",
            cursor: "pointer",
            padding: "10px",
            borderRadius: "50%",
            background: lowStockItems.length > 0 ? "#fff0f0" : "#f8f9fa",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "42px",
            width: "42px",
            border: lowStockItems.length > 0 ? "1px solid #ffeded" : "none",
          }}
          className="stock-alert-bell"
        >
          <span style={{ fontSize: "20px" }}>
            🔔
          </span>
          {lowStockItems.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                background: "#ff4757",
                color: "white",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                border: "2px solid white",
                boxShadow: "0 2px 8px rgba(255, 71, 87, 0.6)",
                animation: "pulse 1.5s infinite",
              }}
            >
              {lowStockItems.length}
            </span>
          )}
        </div>
        {/* BOUTON FERMETURE DU SALON (VISIBLE PAR LA PATRONNE) */}
        <button
          onClick={() => {
            requestAccess("Clôture de la Journée", () => {
              setClosureStep(1);
              setShowClosureModal(true);
            });
          }}
          className="clôture-trigger"
          style={{
            alignSelf: "center",
            marginRight: "20px",
            background: "linear-gradient(135deg, #2c3e50, #000000)",
            color: "white",
            border: "none",
            borderRadius: "50px",
            padding: "8px 20px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            animation: hasDoneClosureToday ? "none" : "pulse 2s infinite",
            opacity: hasDoneClosureToday ? 0.7 : 1,
          }}
        >
          {hasDoneClosureToday ? " ✅ Journée Clôturée" : " 🚪 Fermer le Salon"}
        </button>
      </div>
      {/* MODAL COMMANDES  ? FAIRE */}
      {showPendingOrdersModal && (
        <div
          className="modal-overlay"
          style={{ zIndex: 100005 }}
          onClick={() => setShowPendingOrdersModal(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: "600px", padding: "0", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "#3498db",
                color: "white",
                padding: "20px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "24px" }}>
                📦 MES COMMANDES À FAIRE
              </h2>
              <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
                Liste des produits à acheter
              </p>
              <button
                onClick={() => setShowPendingOrdersModal(false)}
                style={{
                  position: "absolute",
                  right: "20px",
                  top: "20px",
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✖
              </button>
            </div>
            <div
              style={{ padding: "20px", maxHeight: "500px", overflowY: "auto" }}
            >
              {pendingOrders.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {pendingOrders.map((order, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "15px",
                        background: "#f8fbff",
                        borderRadius: "12px",
                        border: "1px solid #d6eaff",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            color: "#2c3e50",
                            fontSize: "15px",
                          }}
                        >
                          {order.nom}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#7f8c8d",
                            marginTop: "4px",
                          }}
                        >
                          🛒   {order.fournisseur}  💆‍♀️  Y". Ajouté le{" "}
                          {order.date.split("-").reverse().join("/")}
                        </div>
                        <div style={{ marginTop: "5px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              background:
                                order.type === "technical"
                                  ? "#9b59b6"
                                  : "#e67e22",
                              color: "white",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                            }}
                          >
                            {order.type === "technical" ? "Technique" : "Vente"}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="pay-btn"
                          style={{
                            margin: 0,
                            padding: "8px 15px",
                            fontSize: "12px",
                            background: "#2ecc71",
                            width: "auto",
                          }}
                          onClick={() => validateOrderReceipt(order.nom)}
                        >
                          📦  Reçu
                        </button>
                        <button
                          className="pay-btn"
                          style={{
                            margin: 0,
                            padding: "8px 10px",
                            fontSize: "12px",
                            background: "#e74c3c",
                            width: "auto",
                          }}
                          onClick={() => {
                            setCustomPopup({
                              show: true,
                              type: "confirm",
                              title: " 🗑️ Confirmer suppression",
                              message: `Voulez-vous vraiment retirer "${order.nom}" de vos commandes à faire ?`,
                              onConfirm: () => {
                                setPendingOrders((prev) =>
                                  prev.filter((o) => o.nom !== order.nom),
                                );
                                setCustomPopup({ show: false });
                              },
                            });
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "#bdc3c7",
                  }}
                >
                  <div style={{ fontSize: "64px", marginBottom: "20px" }}>
                    🛒
                  </div>
                  <h3>Votre liste est vide</h3>
                  <p>
                    Ajoutez des produits depuis la cloche d'alerte ou le tableau
                    des stocks.
                  </p>
                </div>
              )}
            </div>
            <div
              style={{
                padding: "20px",
                background: "#f8f9fa",
                borderTop: "1px solid #eee",
                textAlign: "center",
              }}
            >
              <button
                className="pay-btn"
                style={{ background: "#7f8c8d", margin: 0, width: "100%" }}
                onClick={() => setShowPendingOrdersModal(false)}
              >
                FERMER
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL PERSONNALIS ? (ALERT/CONFIRM) */}
      {customPopup.show && (
        <div
          className="modal-overlay"
          style={{ zIndex: 100010 }}
          onClick={() => setCustomPopup({ ...customPopup, show: false })}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: "400px",
              textAlign: "center",
              padding: "30px",
              borderRadius: "25px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                color: customPopup.type === "alert" ? "#3498db" : "#e74c3c",
                marginBottom: "15px",
              }}
            >
              {customPopup.title}
            </h2>
            <p
              style={{
                color: "#2d3436",
                fontSize: "16px",
                lineHeight: "1.5",
                marginBottom: "25px",
              }}
            >
              {customPopup.message}
            </p>
            <div
              style={{ display: "flex", gap: "15px", justifyContent: "center" }}
            >
              {customPopup.type === "confirm" && (
                <button
                  className="pay-btn"
                  style={{ background: customPopup.cancelText ? "#3498db" : "#7f8c8d", margin: 0, flex: 1 }}
                  onClick={() => {
                    if (customPopup.onCancel) customPopup.onCancel();
                    else setCustomPopup({ ...customPopup, show: false });
                  }}
                >
                  {customPopup.cancelText || "ANNULER"}
                </button>
              )}
              <button
                className="pay-btn"
                style={{
                  background:
                    customPopup.type === "alert" ? "#3498db" : "#e74c3c",
                  margin: 0,
                  flex: 1,
                }}
                onClick={() => {
                  if (customPopup.onConfirm) customPopup.onConfirm();
                  else setCustomPopup({ ...customPopup, show: false });
                }}
              >
                {customPopup.confirmText || (customPopup.type === "confirm" ? "CONFIRMER" : "D'ACCORD")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL RÉCEPTION COMMANDE (REMPLACE PROMPT) */}
      {receiptModal.show && (
        <div
          className="modal-overlay"
          style={{ zIndex: 100015 }}
          onClick={() => setReceiptModal({ ...receiptModal, show: false })}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: "450px",
              padding: "0",
              overflow: "hidden",
              borderRadius: "25px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "#2ecc71",
                color: "white",
                padding: "25px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "10px" }}> 📦 </div>
              <h2 style={{ margin: 0 }}>Réception de Stock</h2>
              <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
                {receiptModal.productName}
              </p>
            </div>
            <div style={{ padding: "30px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "15px",
                  fontWeight: "bold",
                  color: "#2c3e50",
                }}
              >
                Quantité reçue :
              </label>
              <input
                type="number"
                id="receipt-qty-input"
                defaultValue="1"
                autoFocus
                onFocus={(e) => e.target.select()}
                style={{
                  width: "100%",
                  padding: "15px",
                  fontSize: "24px",
                  textAlign: "center",
                  borderRadius: "15px",
                  border: "2px solid #2ecc71",
                  outline: "none",
                  fontWeight: "bold",
                  color: "#27ae60",
                }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "#7f8c8d",
                  marginTop: "10px",
                  textAlign: "center",
                }}
              >
                Cette quantité sera ajoutée au stock{" "}
                <strong>
                  {receiptModal.type === "technical" ? "Technique" : "Vente"}
                </strong>
                .
              </p>
            </div>
            <div
              style={{
                padding: "20px",
                background: "#f8f9fa",
                display: "flex",
                gap: "15px",
              }}
            >
              <button
                className="pay-btn"
                style={{ background: "#7f8c8d", margin: 0, flex: 1 }}
                onClick={() =>
                  setReceiptModal({ ...receiptModal, show: false })
                }
              >
                ANNULER
              </button>
              <button
                className="pay-btn"
                style={{ background: "#2ecc71", margin: 0, flex: 1 }}
                onClick={() => {
                  const qty =
                    document.getElementById("receipt-qty-input").value;
                  finalizeOrderReceipt(
                    receiptModal.productName,
                    qty,
                    receiptModal.type,
                  );
                }}
              >
                VALIDER
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL FERMETURE DU SALON (ASSISTANT ZEN) */}
      {showClosureModal && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 100020,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            className="modal-content animate-in"
            style={{
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "0",
              borderRadius: "30px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header Dynamique par étape */}
            <div
              style={{
                background:
                  clôtureStep === 4
                    ? "linear-gradient(135deg, #1e3c72, #2a5298)"
                    : "#2c3e50",
                color: "white",
                padding: "30px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>
                {clôtureStep === 1 && " 👤 "}
                {clôtureStep === 2 && " 📦 "}
                {clôtureStep === 3 && " 🎯"}
                {clôtureStep === 4 && "🎉"}
              </div>
              <h2 style={{ margin: 0, letterSpacing: "2px" }}>
                {clôtureStep === 1 && "CONTROLE DE CAISSE"}
                {clôtureStep === 2 && "PRODUITS MANQUANTS"}
                {clôtureStep === 3 && "MISSIONS DU JOUR"}
                {clôtureStep === 4 && "JOURNÉE TERMINÉE !"}
              </h2>
              <p
                style={{ margin: "10px 0 0 0", opacity: 0.8, fontSize: "14px" }}
              >
                Étape {clôtureStep} sur 4
              </p>
            </div>
            <div style={{ padding: "40px", minHeight: "300px" }}>
              {/*  ÉTAPE 1 : CAISSE */}
              {clôtureStep === 1 && (
                <div className="animate-in">
                  <h3
                    style={{
                      textAlign: "center",
                      color: "#34495e",
                      marginBottom: "25px",
                    }}
                  >
                    Bilan complet de votre Journée
                  </h3>
                  {(() => {
                    const stats = getTodayStats();
                    return (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "15px",
                        }}
                      >
                        {/* MODES DE Paiement */}
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "15px",
                            borderRadius: "15px",
                            border: "1px solid #eee",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#7f8c8d",
                              textTransform: "uppercase",
                            }}
                          >
                            Carte Bancaire
                          </div>
                          <div
                            style={{
                              fontSize: "20px",
                              fontWeight: "bold",
                              color: "#3498db",
                            }}
                          >
                            {stats.cb.toFixed(2)}€                          </div>
                        </div>
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "15px",
                            borderRadius: "15px",
                            border: "1px solid #eee",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#7f8c8d",
                              textTransform: "uppercase",
                            }}
                          >
                            Espèces
                          </div>
                          <div
                            style={{
                              fontSize: "20px",
                              fontWeight: "bold",
                              color: "#27ae60",
                            }}
                          >
                            {stats.esp.toFixed(2)}€                          </div>
                        </div>
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "15px",
                            borderRadius: "15px",
                            border: "1px solid #eee",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#7f8c8d",
                              textTransform: "uppercase",
                            }}
                          >
                            Chèques / Virements
                          </div>
                          <div
                            style={{
                              fontSize: "20px",
                              fontWeight: "bold",
                              color: "#8e44ad",
                            }}
                          >
                            {(stats.chq + stats.vir).toFixed(2)}€                          </div>
                        </div>
                        <div
                          style={{
                            background: "#ebf5fb",
                            padding: "15px",
                            borderRadius: "15px",
                            border: "1px solid #d6eaf8",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#2980b9",
                              textTransform: "uppercase",
                            }}
                          >
                            Nombre de Clients
                          </div>
                          <div
                            style={{
                              fontSize: "20px",
                              fontWeight: "bold",
                              color: "#2980b9",
                            }}
                          >
                            {stats.count}
                          </div>
                        </div>
                        {/* RÉPARTITION ACTIVITÉ */}
                        <div
                          style={{
                            gridColumn: "span 2",
                            display: "flex",
                            gap: "10px",
                            marginTop: "10px",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              background: "#fcf3cf",
                              padding: "12px",
                              borderRadius: "12px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#b7950b",
                                textTransform: "uppercase",
                              }}
                            >
                              Prestations
                            </div>
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#b7950b",
                              }}
                            >
                              {stats.services.toFixed(2)}€                            </div>
                          </div>
                          <div
                            style={{
                              flex: 1,
                              background: "#d5f5e3",
                              padding: "12px",
                              borderRadius: "12px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#1d8348",
                                textTransform: "uppercase",
                              }}
                            >
                              Ventes Produits
                            </div>
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#1d8348",
                              }}
                            >
                              {stats.vents.toFixed(2)}€                            </div>
                          </div>
                        </div>
                        {/* TOTAL GLOBAL */}
                        <div
                          style={{
                            gridColumn: "span 2",
                            background: "#2c3e50",
                            padding: "20px",
                            borderRadius: "20px",
                            textAlign: "center",
                            color: "white",
                            marginTop: "10px",
                            boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div style={{ fontSize: "14px", opacity: 0.8 }}>
                            TOTAL GÉNÉRAL DU JOUR
                          </div>
                          <div style={{ fontSize: "42px", fontWeight: "bold" }}>
                            {stats.total.toFixed(2)}€                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/*  ÉTAPE 2 : STOCKS */}
              {clôtureStep === 2 && (
                <div className="animate-in">
                  <h3
                    style={{
                      textAlign: "center",
                      color: "#34495e",
                      marginBottom: "20px",
                    }}
                  >
                    Optimisez vos commandes
                  </h3>
                  {(() => {
                    const missing = lowStockItems.filter(
                      (item) => !pendingOrders.some((o) => o.nom === item.nom),
                    );
                    if (missing.length === 0) {
                      return (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                          <div style={{ fontSize: "50px" }}>✅</div>
                          <p style={{ color: "#2ecc71", fontWeight: "bold" }}>
                            Tous vos produits en alerte sont déjà en commande !
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <p
                          style={{
                            textAlign: "center",
                            fontSize: "14px",
                            color: "#7f8c8d",
                            marginBottom: "20px",
                          }}
                        >
                          Ces produits sont en alerte mais pas encore dans votre
                          liste de courses :
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            maxHeight: "250px",
                            overflowY: "auto",
                            paddingRight: "10px",
                          }}
                        >
                          {missing.map((item, i) => (
                            <div
                              key={i}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto auto",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px 20px",
                                background: "#fffcf0",
                                borderRadius: "15px",
                                border: "1px solid #f9ebea",
                              }}
                            >
                              <div style={{ fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.nom}
                              </div>
                              <div
                                style={{ fontSize: "11px", color: "#e67e22", whiteSpace: "nowrap", textAlign: "right", minWidth: "120px" }}
                              >
                                Stock : {item.quantite} (Seuil: {item.seuil})
                              </div>
                              <button
                                className="chip"
                                style={{
                                  background: "#3498db",
                                  color: "white",
                                  border: "none",
                                  padding: "5px 15px",
                                }}
                                title="Modifier"
                                onClick={() => startEditStockItem(item.nom)}
                              >
                                ✏️
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/*  ÉTAPE 3 : MISSIONS */}
              {clôtureStep === 3 && (
                <div className="animate-in">
                  <h3
                    style={{
                      textAlign: "center",
                      color: "#34495e",
                      marginBottom: "20px",
                    }}
                  >
                    Dernier coup d'œil aux tâches
                  </h3>
                  {(() => {
                    const pending = missions.filter(
                      (m) => m.statut !== "TERMINEE",
                    );
                    if (pending.length === 0) {
                      return (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                          <div style={{ fontSize: "50px" }}>✅</div>
                          <p style={{ color: "#2ecc71", fontWeight: "bold" }}>
                            Toutes les missions du jour sont terminées ! Beau
                            travail.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <p
                          style={{
                            textAlign: "center",
                            fontSize: "14px",
                            color: "#7f8c8d",
                            marginBottom: "20px",
                          }}
                        >
                          Il reste quelques missions en attente ou à vérifier :
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            maxHeight: "250px",
                            overflowY: "auto",
                          }}
                        >
                          {pending.map((m, i) => (
                            <div
                              key={i}
                              style={{
                                padding: "12px 20px",
                                background: "#f4f7f6",
                                borderRadius: "15px",
                                borderLeft: "5px solid #1abc9c",
                              }}
                            >
                              <div style={{ fontWeight: "bold" }}>
                                {m.titre}
                              </div>
                              <div
                                style={{ fontSize: "11px", color: "#7f8c8d" }}
                              >
                                Statut : {m.statut.replace("_", " ")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/*  ÉTAPE 4 : RECAP FINAL */}
              {clôtureStep === 4 && (
                <div className="animate-in" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "60px", marginBottom: "20px" }}>
                    🎉
                  </div>
                  <h3 style={{ color: "#2c3e50", fontSize: "24px" }}>
                    Félicitations pour cette Journée !
                  </h3>
                  {isLastDayOfMonth() && (
                    <div
                      style={{
                        background: "#fdedec",
                        border: "2px solid #e74c3c",
                        color: "#c0392b",
                        padding: "15px",
                        borderRadius: "15px",
                        marginBottom: "20px",
                        fontWeight: "bold",
                      }}
                    >
                      📅 C'est le dernier jour du mois !<br />
                      Le bilan mensuel sera automatiquement inclés.
                    </div>
                  )}
                  <div
                    style={{
                      margin: "20px 0",
                      padding: "25px",
                      background:
                        "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
                      borderRadius: "25px",
                      border: "1px solid #ddd",
                    }}
                  >
                    {(() => {
                      const stats = getTodayStats();
                      return (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "15px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                color: "#2c3e50",
                              }}
                            >
                              {stats.count}
                            </div>
                            <div style={{ fontSize: "12px", color: "#7f8c8d" }}>
                              Clients servis
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                color: "#2c3e50",
                              }}
                            >
                              {stats.total.toFixed(0)}€                            </div>
                            <div style={{ fontSize: "12px", color: "#7f8c8d" }}>
                              Chiffre d'Affaires
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <p
                    style={{
                      color: "#7f8c8d",
                      fontSize: "14px",
                      fontStyle: "italic",
                    }}
                  >
                    {isLastDayOfMonth()
                      ? "Les rapports Excel (Jour + Mois) vont être générés."
                      : "Le rapport Excel du jour va être généré."}
                    <br />
                    N'oubliez pas d'éteindre les lumières !
                  </p>
                </div>
              )}
            </div>
            {/* Barre de navigation du modal */}
            <div
              style={{
                padding: "30px",
                background: "#f8f9fa",
                display: "flex",
                gap: "20px",
                borderTop: "1px solid #eee",
              }}
            >
              {clôtureStep < 4 ? (
                <>
                  <button
                    className="pay-btn"
                    style={{ background: "#7f8c8d", margin: 0, flex: 1 }}
                    onClick={() => setShowClosureModal(false)}
                  >
                    PLUS TARD
                  </button>
                  <button
                    className="pay-btn"
                    style={{ background: "#34495e", margin: 0, flex: 2 }}
                    onClick={() => setClosureStep((prev) => prev + 1)}
                  >
                    VALIDER & CONTINUER ➔
                  </button>
                </>
              ) : (
                <button
                  className="pay-btn"
                  style={{
                    background: "linear-gradient(135deg, #2ecc71, #27ae60)",
                    margin: 0,
                    width: "100%",
                    fontSize: "18px",
                    height: "60px",
                  }}
                  onClick={() => {
                    handlePrintDailyReport("Perso");
                    if (isLastDayOfMonth()) {
                      handlePrintMonthlyReport("Perso");
                    }
                    setHasDoneClosureToday(true);
                    setShowClosureModal(false);
                    setCustomPopup({
                      show: true,
                      type: "alert",
                      title: "🎉 Bonne soirée !",
                      message: isLastDayOfMonth()
                        ? "Journée et mois clôturés ! Rapports générés."
                        : "Journée clôturée avec succès. À demain !",
                    });
                  }}
                >
                  TERMINER & GÉNÉRER LE RAPPORT
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div
        className="main-content"
        style={{
          position: "relative",
          paddingTop: activeTab !== "EXCEL" ? "40px" : "0",
          flexDirection: activeTab === "EXCEL" ? "column" : undefined,
          overflowY: activeTab === "EXCEL" ? "auto" : undefined,
          overflowX: activeTab === "EXCEL" ? "hidden" : undefined,
        }}
      >
        {/* Affichage Compact de la Date de Travail Active (Haut Gauche) */}
        {activeTab !== "EXCEL" && (
          <div
            style={{
              position: "absolute",
              top: "5px",
              left: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 10px",
              background:
                selectedDay !== new Date().toLocaleDateString("sv-SE")
                  ? "rgba(231, 76, 60, 0.2)"
                  : "rgba(248, 249, 250, 0.8)",
              borderRadius: "20px",
              border:
                selectedDay !== new Date().toLocaleDateString("sv-SE")
                  ? "1.5px solid #e74c3c"
                  : "1px solid #eee",
              fontSize: "11px",
              color:
                selectedDay !== new Date().toLocaleDateString("sv-SE")
                  ? "#e74c3c"
                  : "#666",
              zIndex: 10,
              animation:
                selectedDay !== new Date().toLocaleDateString("sv-SE")
                  ? "blink-red 2s infinite ease-in-out"
                  : "none",
              transition: "all 0.3s ease",
            }}
          >
            <span style={{ fontSize: "14px" }}>📅</span>
            <strong>
              {new Date(selectedDay).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </strong>
            {selectedDay !== new Date().toLocaleDateString("sv-SE") && (
              <span style={{ color: "#e67e22", fontWeight: "bold" }}>
                (Mode différé)
              </span>
            )}
          </div>
        )}
        {/* GAUCHE : CATALOGUE */}
        {(activeTab === "COIFFURE" ||
          activeTab === "ESTHÉTIQUE" ||
          activeTab === "VENTE") && (
            <div className="left-panel">
              <div
                className="client-bar"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "15px",
                  marginBottom: "20px",
                  width: "100%",
                }}
              >
                {!isAddingNewClient && !isSelectingClient ? (
                  <>
                    <button
                      className="pay-btn"
                      style={{
                        flex: 1,
                        maxWidth: "250px",
                        height: "48px",
                        margin: "0",
                      }}
                      onClick={() => {
                        setIsAddingNewClient(true);
                        setIsSelectingClient(false);
                        setClient({ nom: "", num: "" });
                        setPayMode(null);
                      }}
                    >
                      👤  Nouveau Client
                    </button>
                    <button
                      className="pay-btn"
                      style={{
                        flex: 1,
                        maxWidth: "250px",
                        height: "48px",
                        margin: "0",
                      }}
                      onClick={() => {
                        setIsSelectingClient(true);
                        setIsAddingNewClient(false);
                        setClient({ nom: "", num: "" });
                        setPayMode(null);
                      }}
                    >
                      🔎  Chercher Client
                    </button>
                  </>
                ) : (
                  <button
                    className="pay-btn"
                    style={{
                      flex: 1,
                      maxWidth: "250px",
                      height: "48px",
                      margin: "0",
                      background: "#e74c3c",
                      color: "white",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(231, 76, 60, 0.3)",
                    }}
                    onClick={() => {
                      setIsAddingNewClient(false);
                      setIsSelectingClient(false);
                    }}
                  >
                    ⬅️ Retour / Annuler
                  </button>
                )}
              </div>
              {isAddingNewClient && (
                <div
                  className="client-bar animate-in"
                  style={{
                    padding: "20px",
                    background: "#fff",
                    borderRadius: "15px",
                    marginBottom: "15px",
                    border: "3px solid var(--accent)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                  }}
                >
                  <input
                    placeholder="Nom..."
                    value={client.nom}
                    onChange={(e) =>
                      setClient({ ...client, nom: e.target.value.toUpperCase() })
                    }
                    style={{
                      flex: 1,
                      backgroundColor: "#fff0f6",
                      color: "#333",
                      fontWeight: "bold",
                      border: "2px solid #ff1493",
                    }}
                  />
                  <input
                    placeholder="Prénom..."
                    value={client.prenom}
                    onChange={(e) =>
                      setClient({ ...client, prenom: e.target.value.toUpperCase() })
                    }
                    style={{
                      flex: 1,
                      backgroundColor: "#fff0f6",
                      color: "#333",
                      fontWeight: "bold",
                      border: "2px solid #ff1493",
                    }}
                  />
                  <input
                    placeholder="Téléphone..."
                    value={client.num}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length < client.num.length) {
                        setClient({ ...client, num: val });
                        return;
                      }
                      setClient({ ...client, num: formatPhoneNumber(val) });
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: "#fff0f6",
                      color: "#333",
                      fontWeight: "bold",
                      border: "2px solid #ff1493",
                    }}
                  />
                </div>
              )}
              {isSelectingClient && (
                <div
                  className="client-selector-mini"
                  style={{
                    marginBottom: "15px",
                    padding: "15px",
                    background: "#f8f9fa",
                    borderRadius: "15px",
                    border: "2px solid var(--primary)",
                  }}
                >
                  <div style={{ position: "relative", marginBottom: "10px" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none", zIndex: 1 }}>🔎</span>
                    <input
                      className="search-bar"
                      placeholder="Rechercher un client..."
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                    {clients
                      .sort((a, b) => a.nom.localeCompare(b.nom))
                      .filter((c) =>
                        (c.nom || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
                        (c.prenom || "").toLowerCase().includes(clientSearch.toLowerCase())
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          className="client-item-mini"
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                          onClick={() => {
                            setClient({
                              nom: c.nom || "",
                              prenom: c.prenom || "",
                              num: c.num || "",
                              id: c.id
                            });
                            setIsSelectingClient(false);
                            // Logique promo fidélité (Chaque 10éme visite est offerte/remisée)
                            // Fallback: si pas de compteurs séparés, utiliser le global comme coiffure
                            const coiffCount = c.visitesCoiffure != null ? c.visitesCoiffure : (c.visites || 0);
                            const esthCount = c.visitesEsthetique || 0;
                            const nextCoiff = coiffCount + 1;
                            const nextEsth = esthCount + 1;
                            const isCoiffMilestone = nextCoiff > 1 && nextCoiff % 10 === 0;
                            const isEsthMilestone = esthCount > 0 && nextEsth > 1 && nextEsth % 10 === 0;
                            if (isCoiffMilestone && isEsthMilestone) {
                              setCustomPopup({
                                show: true, type: "alert",
                                title: `🌟 ${nextCoiff}ème visite Coiffure & ${nextEsth}ème visite Esthétique !`,
                                message: `${c.nom} ${c.prenom || ""} atteint ses milestones en Coiffure ET Esthétique ! Choisissez sur quel domaine appliquer la réduction.`,
                              });
                            } else if (isCoiffMilestone) {
                              setRetraitCategory("COIFFURE");
                              setCustomPopup({
                                show: true, type: "alert",
                                title: `✂️ ${nextCoiff}ème visite Coiffure !`,
                                message: `${c.nom} ${c.prenom || ""} arrive à sa ${nextCoiff}ème visite en Coiffure ! Pensez à appliquer une réduction fidélité.`,
                              });
                            } else if (isEsthMilestone) {
                              setRetraitCategory("ESTHÉTIQUE");
                              setCustomPopup({
                                show: true, type: "alert",
                                title: `💄 ${nextEsth}ème visite Esthétique !`,
                                message: `${c.nom} ${c.prenom || ""} arrive à sa ${nextEsth}ème visite en Esthétique ! Pensez à appliquer une réduction fidélité.`,
                              });
                            }
                          }}
                        >
                          <span style={{ fontWeight: "bold" }}>
                            {c.nom} {c.prenom || ""}
                          </span>
                          <small>{c.num}</small>
                        </div>
                      ))}
                    {clients.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "12px",
                          color: "#999",
                        }}
                      >
                        Aucun client enregistré
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="search-container">
                <span className="search-icon"> 🔎 </span>
                <input
                  className="search-bar"
                  placeholder="RECHERCHE RAPIDE..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value.toUpperCase())}
                  style={{ textTransform: "uppercase" }}
                />
              </div>
              {/* BOUTON CRÉER NOUVELLE PRESTATION (VISIBLE UNIQUEMENT DANS COIFFURE ET ESTHÉTIQUE) */}
              {!search &&
                (activeTab === "COIFFURE" || activeTab === "ESTHÉTIQUE") && (
                  <div style={{ marginBottom: "15px" }}>
                    <button
                      className="pay-btn"
                      style={{
                        width: "100%",
                        background: "linear-gradient(135deg, #00bfff, #ff1493)",
                        fontSize: "14px",
                        padding: "12px",
                        border: "none",
                        borderRadius: "12px",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      onClick={() => {
                        // Pre-fill category if possible based on current view to be helpful
                        let defaultCat = "";
                        if (activeTab === "COIFFURE")
                          defaultCat = activeFilter || "HOMME";
                        if (activeTab === "ESTHÉTIQUE")
                          defaultCat = activeFilter || "ONGLERIE";
                        setNewServiceData({
                          name: "",
                          price: "",
                          category: defaultCat,
                        });
                        setShowNewServiceModal(true);
                      }}
                    >
                      ✨ ➕ Créer Nouvelle Prestation
                    </button>
                  </div>
                )}
              {/* MODAL CRÉATION SERVICE */}
              {showNewServiceModal && (
                <div
                  className="modal-overlay"
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.7)",
                    zIndex: 10000,
                    display: "flex",
                    alignItems: "flex-start",
                    padding: "20px",
                    overflowY: "auto",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="modal-content"
                    style={{
                      background: "white",
                      padding: "25px",
                      borderRadius: "15px",
                      width: "90%",
                      maxWidth: "400px",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    }}
                  >
                    <h3 style={{ color: "#2d3436", marginTop: 0 }}>
                      ✨ Nouvelle Prestation
                    </h3>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Nom de la prestation
                      </label>
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: "10px",
                            fontSize: "20px",
                          }}
                        >
                          {getItemIcon(
                            newServiceData.name,
                            newServiceData.category,
                            "service"
                          )}
                        </span>
                        <input
                          autoFocus
                          placeholder="EX: COUPE TRANSFORM... "
                          value={newServiceData.name}
                          onChange={(e) =>
                            setNewServiceData({
                              ...newServiceData,
                              name: e.target.value.toUpperCase(),
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "10px 10px 10px 45px",
                            borderRadius: "5px",
                            border: "1px solid #ddd",
                            textTransform: "uppercase",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Prix de vente (€)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={
                          newServiceData.price === 0 || newServiceData.price === "" ? "" : newServiceData.price
                        }
                        onChange={(e) =>
                          setNewServiceData({
                            ...newServiceData,
                            price: e.target.value,
                          })
                        }
                        onFocus={(e) => e.target.select()}
                        onBlur={() => { if (newServiceData.price === "") setNewServiceData({ ...newServiceData, price: 0 }); }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "5px",
                          border: "1px solid #ddd",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Catégorie / Filtre
                      </label>
                      {!isCustomCategory ? (
                        <select
                          value={newServiceData.category}
                          onChange={(e) => {
                            if (e.target.value === "NEW_CAT") {
                              setIsCustomCategory(true);
                              setNewServiceData({
                                ...newServiceData,
                                category: "",
                              });
                            } else {
                              setNewServiceData({
                                ...newServiceData,
                                category: e.target.value,
                              });
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "5px",
                            border: "1px solid #ddd",
                          }}
                        >
                          <option value="" disabled>
                            -- Choisir une Catégorie --
                          </option>
                          {activeTab === "COIFFURE" && (
                            <>
                              <optgroup label="Homme">
                                <option value="HOMME">HOMME</option>
                                <option value="TECHNIQUE HOMME">
                                  TECHNIQUE HOMME
                                </option>
                              </optgroup>
                              <optgroup label="Femme">
                                <option value="DAME COURTS">DAME COURTS</option>
                                <option value="DAME LONGS">DAME LONGS</option>
                                <option value="SOINS">SOINS</option>
                                <option value="TECHNIQUE COURTS">
                                  TECHNIQUE COURTS
                                </option>
                                <option value="TECHNIQUE LONGS">
                                  TECHNIQUE LONGS
                                </option>
                                <option value="TECHNIQUE SEULE">
                                  TECHNIQUE SEULE
                                </option>
                              </optgroup>
                              <optgroup label="Enfant">
                                <option value="JUNIOR">JUNIOR</option>
                              </optgroup>
                            </>
                          )}
                          {activeTab === "ESTHÉTIQUE" &&
                            (availableFilters.ESTHETIQUE.length > 0
                              ? availableFilters.ESTHETIQUE.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))
                              : [
                                "ONGLERIE",
                                "EPILATION",
                                "SOINS VISAGE",
                                "REGARDS",
                                "MAQUILLAGE",
                                "NAIL ART",
                                "SOINS CORPS",
                              ].map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              )))}
                          {activeTab === "VENTE" && (
                            <>
                              <option value="PRODUIT">
                                PRODUIT (Shampoing, Soin...)
                              </option>
                              <option value="DIVERS">
                                👤  DIVERS (Bijoux, Accessoires...)
                              </option>
                              {Array.from(new Set(availableFilters.VENTE))
                                .filter((f) => f !== "PRODUIT" && f !== "DIVERS")
                                .map((f) => (
                                  <option key={f} value={f}>
                                    {f}
                                  </option>
                                ))}
                            </>
                          )}
                          <option
                            value="NEW_CAT"
                            style={{ fontWeight: "bold", color: "#00bfff" }}
                          >
                            ➕ Nouvelle Catégorie...
                          </option>
                        </select>
                      ) : (
                        <div style={{ display: "flex", gap: "5px" }}>
                          <input
                            autoFocus
                            placeholder="Nom de la nouvelle Catégorie..."
                            value={newServiceData.category}
                            onChange={(e) =>
                              setNewServiceData({
                                ...newServiceData,
                                category: e.target.value.toUpperCase(),
                              })
                            }
                            style={{
                              flex: 1,
                              padding: "10px",
                              borderRadius: "5px",
                              border: "1px solid #00bfff",
                              outline: "none",
                              textTransform: "uppercase",
                            }}
                          />
                          <button
                            onClick={() => setIsCustomCategory(false)}
                            title="Annuler création Catégorie"
                            style={{
                              padding: "0 10px",
                              background: "#fab1a0",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#fffafa",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px dashed #e74c3c",
                      }}
                    >
                      <input
                        type="checkbox"
                        id="isSpecial"
                        checked={newServiceData.isSpecial}
                        onChange={(e) =>
                          setNewServiceData({
                            ...newServiceData,
                            isSpecial: e.target.checked,
                          })
                        }
                        style={{
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                        }}
                      />
                      <label
                        htmlFor="isSpecial"
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "#e74c3c",
                          cursor: "pointer",
                        }}
                      >
                        🎄 Événement spécial (Noël, Pâques...)
                      </label>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => setShowNewServiceModal(false)}
                        style={{
                          padding: "10px 15px",
                          borderRadius: "5px",
                          border: "none",
                          background: "#e74c3c",
                          color: "white",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Annuler / Retour
                      </button>
                      <button
                        onClick={handleAddService}
                        style={{
                          padding: "10px 15px",
                          borderRadius: "5px",
                          border: "none",
                          background: "#00bfff",
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* --- NOUVEAU MENU HIERARCHIQUE COIFFURE --- */}
              {!search && activeTab === "COIFFURE" && (
                <div className="sub-tabs" style={{ marginBottom: "10px" }}>
                  <button
                    className={`sub-tab ${coiffureSubTab === "HOMME" ? "active homme" : ""}`}
                    onClick={() => {
                      setCoiffureSubTab("HOMME");
                      setActiveFilter(null);
                    }}
                  >
                    👤  HOMME
                  </button>
                  <button
                    className={`sub-tab ${coiffureSubTab === "FEMME" ? "active femme" : ""}`}
                    onClick={() => {
                      setCoiffureSubTab("FEMME");
                      setActiveFilter(null);
                    }}
                  >
                    👤  FEMME
                  </button>
                  <button
                    className={`sub-tab ${coiffureSubTab === "ENFANT" ? "active enfant" : ""}`}
                    onClick={() => {
                      setCoiffureSubTab("ENFANT");
                      setActiveFilter(null);
                    }}
                  >
                    👤  ENFANT
                  </button>
                </div>
              )}
              {/* --- NOUVEAU MENU HIERARCHIQUE VENTE --- */}
              {!search && activeTab === "VENTE" && (
                <div className="sub-tabs" style={{ marginBottom: "10px" }}>
                  <button
                    className={`sub-tab ${venteSubTab === "PRODUIT" ? "active" : ""}`}
                    style={{
                      borderColor: "#2ecc71",
                      color: venteSubTab === "PRODUIT" ? "white" : "#2ecc71",
                      backgroundColor:
                        venteSubTab === "PRODUIT" ? "#2ecc71" : "transparent",
                    }}
                    onClick={() => {
                      setVenteSubTab("PRODUIT");
                      setActiveFilter(null);
                    }}
                  >
                    PRODUIT
                  </button>
                  <button
                    className={`sub-tab ${venteSubTab === "DIVERS" ? "active" : ""}`}
                    style={{
                      borderColor: "#f39c12",
                      color: venteSubTab === "DIVERS" ? "white" : "#f39c12",
                      backgroundColor:
                        venteSubTab === "DIVERS" ? "#f39c12" : "transparent",
                    }}
                    onClick={() => {
                      setVenteSubTab("DIVERS");
                      setActiveFilter(null);
                      setDiversData({ name: "", price: "", payMode: "CB" });
                      setShowDiversModal(true);
                    }}
                  >
                    👤  DIVERS
                  </button>
                  <button
                    className={`sub-tab ${venteSubTab === "CARTE CADEAU" ? "active" : ""}`}
                    style={{
                      borderColor: "#9b59b6",
                      color: venteSubTab === "CARTE CADEAU" ? "white" : "#9b59b6",
                      backgroundColor:
                        venteSubTab === "CARTE CADEAU"
                          ? "#9b59b6"
                          : "transparent",
                    }}
                    onClick={() => {
                      setVenteSubTab("CARTE CADEAU");
                      setActiveFilter(null);
                    }}
                  >
                    🌟  CARTE CADEAU
                  </button>
                </div>
              )}
              {/* --- FILTERS (CHIPS) --- */}
              {!search && (
                <div
                  className="filters-container"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  {/* ALWAYS SHOW FAVORITES FILTER IF IN COIFFURE OR ESTHETIQUE */}
                  {(activeTab === "COIFFURE" || activeTab === "ESTHÉTIQUE" || activeTab === "VENTE") && (
                    <button
                      className={
                        activeFilter === "⭐ FAVORIS"
                          ? "filter-chip active"
                          : "filter-chip"
                      }
                      onClick={() => setActiveFilter("⭐ FAVORIS")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "20px",
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        fontWeight: "700",
                        transition: "all 0.2s",
                        backgroundColor:
                          activeFilter === "⭐ FAVORIS" ? "#f1c40f" : "#fff",
                        color:
                          activeFilter === "⭐ FAVORIS" ? "white" : "#7f8c8d",
                        borderColor:
                          activeFilter === "⭐ FAVORIS" ? "#f1c40f" : "#ddd",
                        boxShadow:
                          activeFilter === "⭐ FAVORIS"
                            ? "0 4px 10px rgba(241, 196, 15, 0.3)"
                            : "none",
                      }}
                    >
                      FAVORIS
                    </button>
                  )}
                  {activeTab === "COIFFURE" &&
                    coiffureSubTab &&
                    (coiffureSubTab === "HOMME"
                      ? ["HOMME", "TECHNIQUE HOMME"].map((f) => (
                        <button
                          key={f}
                          className={
                            activeFilter === f
                              ? "filter-chip active"
                              : "filter-chip"
                          }
                          onClick={() => setActiveFilter(f)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "20px",
                            border: "1px solid #ddd",
                            cursor: "pointer",
                            fontWeight: "700",
                            backgroundColor:
                              activeFilter === f ? getChipColor(f) : "#fff",
                            color: activeFilter === f ? "white" : "#7f8c8d",
                            borderColor:
                              activeFilter === f ? getChipColor(f) : "#ddd",
                            boxShadow:
                              activeFilter === f
                                ? `0 4px 10px ${getChipColor(f)}44`
                                : "none",
                          }}
                        >
                          {f}
                        </button>
                      ))
                      : coiffureSubTab === "FEMME"
                        ? [
                          "DAME COURTS",
                          "DAME LONGS",
                          "SOINS",
                          "TECHNIQUE COURTS",
                          "TECHNIQUE LONGS",
                          "TECHNIQUE SEULE",
                        ].map((f) => (
                          <button
                            key={f}
                            className={
                              activeFilter === f
                                ? "filter-chip active"
                                : "filter-chip"
                            }
                            onClick={() => setActiveFilter(f)}
                            style={{
                              padding: "8px 16px",
                              borderRadius: "20px",
                              border: "1px solid #ddd",
                              cursor: "pointer",
                              fontWeight: "700",
                              backgroundColor:
                                activeFilter === f ? getChipColor(f) : "#fff",
                              color: activeFilter === f ? "white" : "#7f8c8d",
                              borderColor:
                                activeFilter === f ? getChipColor(f) : "#ddd",
                              boxShadow:
                                activeFilter === f
                                  ? `0 4px 10px ${getChipColor(f)}44`
                                  : "none",
                            }}
                          >
                            {f}
                          </button>
                        ))
                        : coiffureSubTab === "ENFANT"
                          ? ["JUNIOR"].map((f) => (
                            <button
                              key={f}
                              className={
                                activeFilter === f
                                  ? "filter-chip active"
                                  : "filter-chip"
                              }
                              onClick={() => setActiveFilter(f)}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "20px",
                                border: "1px solid #ddd",
                                cursor: "pointer",
                                fontWeight: "700",
                                backgroundColor:
                                  activeFilter === f ? getChipColor(f) : "#fff",
                                color: activeFilter === f ? "white" : "#7f8c8d",
                                borderColor:
                                  activeFilter === f ? getChipColor(f) : "#ddd",
                                boxShadow:
                                  activeFilter === f
                                    ? `0 4px 10px ${getChipColor(f)}44`
                                    : "none",
                              }}
                            >
                              {f}
                            </button>
                          ))
                          : null)}
                  {/* Custom Catégories for Coiffure */}
                  {activeTab === "COIFFURE" &&
                    availableFilters.COIFFURE.filter(
                      (f) =>
                        ![
                          "HOMME",
                          "TECHNIQUE HOMME",
                          "DAME COURTS",
                          "DAME LONGS",
                          "SOINS",
                          "TECHNIQUE COURTS",
                          "TECHNIQUE LONGS",
                          "TECHNIQUE SEULE",
                          "JUNIOR",
                        ].includes(f),
                    ).map((f) => (
                      <button
                        key={f}
                        className={
                          activeFilter === f
                            ? "filter-chip active"
                            : "filter-chip"
                        }
                        onClick={() => setActiveFilter(f)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "20px",
                          border: "1px solid #ddd",
                          cursor: "pointer",
                          fontWeight: "700",
                          backgroundColor:
                            activeFilter === f ? getChipColor(f) : "#fff",
                          color: activeFilter === f ? "white" : "#7f8c8d",
                          borderColor:
                            activeFilter === f ? getChipColor(f) : "#ddd",
                          boxShadow:
                            activeFilter === f
                              ? `0 4px 10px ${getChipColor(f)}44`
                              : "none",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  {activeTab === "ESTHÉTIQUE" &&
                    availableFilters.ESTHETIQUE.map((f) => (
                      <button
                        key={f}
                        className={
                          activeFilter === f
                            ? "filter-chip active"
                            : "filter-chip"
                        }
                        onClick={() => setActiveFilter(f)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "20px",
                          border: "1px solid #ddd",
                          cursor: "pointer",
                          fontWeight: "700",
                          backgroundColor:
                            activeFilter === f ? getChipColor(f) : "#fff",
                          color: activeFilter === f ? "white" : "#7f8c8d",
                          borderColor:
                            activeFilter === f ? getChipColor(f) : "#ddd",
                          boxShadow:
                            activeFilter === f
                              ? `0 4px 10px ${getChipColor(f)}44`
                              : "none",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  {activeTab === "VENTE" &&
                    venteSubTab === "PRODUIT" &&
                    (() => {
                      // Filtres par FOURNISSEUR pour l'onglet Vente
                      const fournisseurs = Array.from(
                        new Set(
                          Object.values(catalog)
                            .filter(
                              (item) =>
                                (item.type === "retail" || item.type === "both") && item.fournisseur,
                            )
                            .map((item) => item.fournisseur),
                        ),
                      ).sort((a, b) =>
                        a.localeCompare(b, undefined, {
                          numeric: true,
                          sensitivity: "base",
                        }),
                      );
                      return fournisseurs.map((f) => (
                        <button
                          key={f}
                          className={
                            activeFilter === f
                              ? "filter-chip active"
                              : "filter-chip"
                          }
                          onClick={() => setActiveFilter(f)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "20px",
                            border: "1px solid #ddd",
                            cursor: "pointer",
                            fontWeight: "700",
                            backgroundColor:
                              activeFilter === f ? "#e67e22" : "#fff",
                            color: activeFilter === f ? "white" : "#7f8c8d",
                            borderColor: activeFilter === f ? "#e67e22" : "#ddd",
                            boxShadow:
                              activeFilter === f
                                ? "0 4px 10px rgba(230,126,34,0.3)"
                                : "none",
                          }}
                        >
                          🛍️   {f}
                        </button>
                      ));
                    })()}
                </div>
              )}
              {renderCatalog()}
              {/* MODAL ARTICLE DIVERS */}
              {showDiversModal && (
                <div
                  className="modal-overlay"
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.7)",
                    zIndex: 10000,
                    display: "flex",
                    alignItems: "flex-start",
                    padding: "20px",
                    overflowY: "auto",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="modal-content"
                    style={{
                      background: "white",
                      padding: "25px",
                      borderRadius: "15px",
                      width: "90%",
                      maxWidth: "400px",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    }}
                  >
                    <h3 style={{ color: "#2d3436", marginTop: 0 }}>
                      👤  Article Divers (Prix Libre)
                    </h3>
                    <div style={{ marginBottom: "15px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Nom de l'article
                      </label>
                      <input
                        autoFocus
                        placeholder="EX: BIJOUX, BRACELET..."
                        value={diversData.name}
                        onChange={(e) =>
                          setDiversData({ ...diversData, name: e.target.value.toUpperCase() })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            document.getElementById("divers-price-input").focus();
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "5px",
                          border: "1px solid #ddd",
                          textTransform: "uppercase",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Prix de vente (€)
                      </label>
                      <input
                        id="divers-price-input"
                        type="number"
                        placeholder="0"
                        value={diversData.price === 0 || diversData.price === "" ? "" : diversData.price}
                        onChange={(e) =>
                          setDiversData({ ...diversData, price: e.target.value })
                        }
                        onFocus={(e) => e.target.select()}
                        onBlur={() => { if (diversData.price === "") setDiversData({ ...diversData, price: 0 }); }}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            diversData.name &&
                            diversData.price
                          ) {
                            addToCart(
                              `DIVERS - ${diversData.name} - ${parseFloat(diversData.price)}€ - ${diversData.payMode}`,
                            );
                            setShowDiversModal(false);
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "5px",
                          border: "1px solid #ddd",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Moyen de Paiement Divers
                      </label>
                      <div
                        className="pay-modes"
                        style={{ marginTop: "5px", display: "flex", gap: "5px" }}
                      >
                        {["CB", "Esp", "Chq"].map((m) => (
                          <button
                            key={m}
                            onClick={() =>
                              setDiversData({ ...diversData, payMode: m })
                            }
                            style={{
                              flex: 1,
                              padding: "8px",
                              border: "1px solid #ddd",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                              backgroundColor:
                                diversData.payMode === m
                                  ? m === "CB"
                                    ? "#3498db"
                                    : m === "Esp"
                                      ? "#2ecc71"
                                      : "#f1c40f"
                                  : "white",
                              color: diversData.payMode === m ? "white" : "#666",
                              transition: "all 0.2s",
                            }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => setShowDiversModal(false)}
                        style={{
                          padding: "10px 15px",
                          borderRadius: "5px",
                          border: "none",
                          background: "#eee",
                          color: "#666",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        disabled={!diversData.name || !diversData.price}
                        onClick={() => {
                          addToCart(
                            `DIVERS - ${diversData.name} - ${parseFloat(diversData.price)}€ - ${diversData.payMode}`,
                          );
                          setShowDiversModal(false);
                        }}
                        style={{
                          padding: "10px 15px",
                          borderRadius: "5px",
                          border: "none",
                          background: "#f39c12",
                          color: "white",
                          fontWeight: "bold",
                          cursor: "pointer",
                          opacity:
                            !diversData.name || !diversData.price ? 0.5 : 1,
                        }}
                      >
                        Ajouter au Panier
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        {/* ONGLET CLIENTS */}
        {activeTab === "CLIENTS" && renderClientsTab()}
        {/* ONGLET STOCKS */}
        {activeTab === "STOCKS" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {renderStocksTab()}
          </div>
        )}
        {/* ONGLET CORBEILLE */}
        {activeTab === "CORBEILLE" && renderTrashTab()}
        {/* DROITE : TICKET */}
        {(activeTab === "COIFFURE" ||
          activeTab === "ESTHÉTIQUE" ||
          activeTab === "VENTE") && (
            <div className="right-panel ticket-wrapper">
              <div
                className="ticket-header"
                style={{
                  position: "sticky",
                  top: "-15px",
                  background: "white",
                  zIndex: 10,
                  paddingBottom: "10px",
                  paddingTop: "10px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                {/* BANDEAU CLIENT ACTIF */}
                {(() => {
                  const actualClient = client.nom
                    ? clients.find((c) =>
                      client.id ? c.id === client.id : (
                        (c.nom || "").toLowerCase() === client.nom.toLowerCase() &&
                        (c.prenom || "").toLowerCase() === (client.prenom || "").toLowerCase()
                      )
                    )
                    : null;
                  const visites = actualClient ? (actualClient.visites || 1) : 1;
                  const visitesCoiff = actualClient ? (actualClient.visitesCoiffure || 0) : 0;
                  const visitesEsth = actualClient ? (actualClient.visitesEsthetique || 0) : 0;
                  const isMilestone = client.nom && visites > 0 && visites % 10 === 0;
                  return (
                    <div
                      style={{
                        background: isMilestone ? "#f1c40f" : (client.nom ? "#dff9fb" : "#fff"),
                        padding: "10px",
                        borderRadius: "8px",
                        marginBottom: "15px",
                        border: isMilestone ? "2px solid #e74c3c" : (client.nom ? "1px solid #81ecec" : "1px dashed #ccc"),
                        textAlign: "center",
                        transition: "all 0.3s",
                      }}
                    >
                      {client.nom ? (
                        <div style={{ position: "relative" }}>
                          <div
                            style={{
                              fontSize: "11px",
                              color: isMilestone ? "#d35400" : "#00cec9",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              fontWeight: isMilestone ? "bold" : "normal",
                            }}
                          >
                            Client en cours
                          </div>
                          <div
                            style={{
                              fontWeight: "800",
                              fontSize: "20px",
                              color: "#2d3436",
                              margin: "5px 0",
                              textTransform: "uppercase"
                            }}
                          >
                            {client.nom} {client.prenom}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#636e72",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "5px",
                            }}
                          >
                            📞  {client.num || "Pas de numéro"}
                          </div>

                          {isMilestone && (
                            <div style={{ color: "#c0392b", fontWeight: "bold", marginTop: "8px", fontSize: "14px", background: "#fff", padding: "5px", borderRadius: "5px", border: "1px solid #c0392b" }}>
                              ⚠️  {visites}ème VISITE ! Penser à la réduction.
                            </div>
                          )}
                          {!isMilestone && (
                            <div style={{ marginTop: "5px", fontSize: "12px", color: "#7f8c8d", display: "flex", justifyContent: "center", gap: "12px" }}>
                              <span>✂️ Coiffure: <strong>{visitesCoiff}</strong></span>
                              <span>💄 Esthétique: <strong>{visitesEsth}</strong></span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setClient({ nom: "", prenom: "", num: "" });
                              setRemise(0);
                              setIsSelectingClient(false);
                              setIsAddingNewClient(false);
                            }}
                            title="Désélectionner le client"
                            style={{
                              position: "absolute",
                              top: "-5px",
                              right: "-5px",
                              background: "#e74c3c",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              cursor: "pointer",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            color: "#b2bec3",
                            fontStyle: "italic",
                            fontSize: "13px",
                          }}
                        >
                          Aucun client sélectionné
                        </div>
                      )}
                    </div>
                  );
                })()}
                <h2 style={{ margin: 0 }}>👤 NET À PAYER</h2>
                <div className="big-price">{netToPay.toFixed(2)}€ </div>
              </div>
              <div className="payment-controls">
                {(() => {
                  const actualCl = client.nom ? clients.find(cl => client.id ? cl.id === client.id : (cl.nom || "").toLowerCase() === client.nom.toLowerCase() && (cl.prenom || "").toLowerCase() === (client.prenom || "").toLowerCase()) : null;
                  // Fallback: si pas de compteurs séparés, utiliser le global comme coiffure
                  const coiffCount = actualCl ? (actualCl.visitesCoiffure != null ? actualCl.visitesCoiffure : (actualCl.visites || 0)) : 0;
                  const esthCount = actualCl ? (actualCl.visitesEsthetique || 0) : 0;
                  const isCoiffMilestone = (coiffCount + 1) > 1 && (coiffCount + 1) % 10 === 0;
                  const isEsthMilestone = esthCount > 0 && (esthCount + 1) > 1 && (esthCount + 1) % 10 === 0;
                  const isReductionMilestone = isCoiffMilestone || isEsthMilestone;
                  return (
                    <div className="row" style={{
                      flexDirection: "column", alignItems: "flex-start", gap: "10px",
                      ...(isReductionMilestone ? {
                        border: "2px solid #e74c3c",
                        borderRadius: "12px",
                        padding: "12px",
                        animation: "blinkRedBorder 1s ease-in-out infinite",
                        background: "#fff5f5",
                      } : {})
                    }}>
                      {isReductionMilestone && (
                        <style>{`@keyframes blinkRedBorder { 0%, 100% { border-color: #e74c3c; box-shadow: 0 0 8px rgba(231,76,60,0.4); } 50% { border-color: #f39c12; box-shadow: 0 0 15px rgba(243,156,18,0.6); } }`}</style>
                      )}
                      <label style={{ fontWeight: "bold", color: isReductionMilestone ? "#e74c3c" : "#2c3e50" }}>
                        {isReductionMilestone ? "🌟 Remise Fidélité" : "👤 Remise"}
                      </label>
                      <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                        {["COIFFURE", "ESTHÉTIQUE"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setRetraitCategory(cat)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              fontSize: "11px",
                              borderRadius: "8px",
                              border: "1px solid",
                              fontWeight: "bold",
                              cursor: "pointer",
                              backgroundColor: retraitCategory === cat ? (cat === "COIFFURE" ? "#3498db" : "#9b59b6") : "#fff",
                              color: retraitCategory === cat ? "white" : "#7f8c8d",
                              borderColor: retraitCategory === cat ? (cat === "COIFFURE" ? "#3498db" : "#9b59b6") : "#ddd",
                              transition: "all 0.2s"
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "5px", width: "100%" }}>
                        <input
                          type="number"
                          placeholder="Montant €"
                          value={retraitAmount === 0 || retraitAmount === "" ? "" : retraitAmount}
                          onChange={(e) => setRetraitAmount(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => { if (retraitAmount === "") setRetraitAmount(0); }}
                          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                        />
                        {[2, 5, 10].map((val) => (
                          <button
                            key={val}
                            onClick={() => setRetraitAmount(val)}
                            style={{
                              padding: "0 12px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              borderRadius: "8px",
                              border: "1px solid #ddd",
                              background: retraitAmount == val ? "#2c3e50" : "white",
                              color: retraitAmount == val ? "white" : "#666",
                              cursor: "pointer"
                            }}
                          >
                            {val}€                    </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <div className="row">
                  <label>Carte Cadeau €</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={cadeau === 0 || cadeau === "" ? "" : cadeau}
                    onChange={(e) => setCadeau(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => { if (cadeau === "") setCadeau(0); }}
                  />
                </div>
                <div
                  className="row"
                  style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px dashed #eee",
                  }}
                >
                  {null}
                </div>
                <div className="pay-modes">
                  {["CB", "Esp", "Chq", "Multi"].map((m) => (
                    <button
                      key={m}
                      className={payMode === m ? "mode active" : "mode"}
                      onClick={() => setPayMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {payMode === "Multi" && (
                  <div className="multi-inputs" style={{ marginBottom: "15px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#666", fontWeight: "bold" }}> 👤  CB</label>
                      <input
                        placeholder="0"
                        type="number"
                        value={amounts.cb === 0 || amounts.cb === "" ? "" : amounts.cb}
                        onChange={(e) =>
                          setAmounts({ ...amounts, cb: e.target.value })
                        }
                        onFocus={(e) => e.target.select()}
                        onBlur={() => { if (amounts.cb === "") setAmounts({ ...amounts, cb: 0 }); }}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#666", fontWeight: "bold" }}> 👤  Espèces</label>
                      <input
                        placeholder="0"
                        type="number"
                        value={amounts.esp === 0 || amounts.esp === "" ? "" : amounts.esp}
                        onChange={(e) =>
                          setAmounts({ ...amounts, esp: e.target.value })
                        }
                        onFocus={(e) => e.target.select()}
                        onBlur={() => { if (amounts.esp === "") setAmounts({ ...amounts, esp: 0 }); }}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#666", fontWeight: "bold" }}> ✏️ Chèques</label>
                      <input
                        placeholder="0"
                        type="number"
                        value={amounts.chq === 0 || amounts.chq === "" ? "" : amounts.chq}
                        onChange={(e) =>
                          setAmounts({ ...amounts, chq: e.target.value })
                        }
                        onFocus={(e) => e.target.select()}
                        onBlur={() => { if (amounts.chq === "") setAmounts({ ...amounts, chq: 0 }); }}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                )}
                <div
                  className="row"
                  style={{
                    marginTop: "5px",
                    paddingTop: "10px",
                    borderTop: "1px dashed #eee",
                  }}
                >
                  <label style={{ fontWeight: "bold", color: "var(--primary)" }}>
                    👤  Qui encaisse ?
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", width: "100%" }}>
                    {STAFF_NAMES.map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setSelectedCashiers(prev =>
                            prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
                          );
                        }}
                        className={selectedCashiers.includes(n) ? "chip active" : "chip"}
                        style={{
                          padding: "8px 15px",
                          borderRadius: "20px",
                          border: "1px solid " + (selectedCashiers.includes(n) ? "var(--primary)" : "#ddd"),
                          background: selectedCashiers.includes(n) ? "var(--primary)" : "white",
                          color: selectedCashiers.includes(n) ? "white" : "#666",
                          fontSize: "13px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {client.nom && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "12px",
                      background: "#f8f9fa",
                      borderRadius: "12px",
                      border: "1px solid #eee",
                    }}
                  >
                    <div
                      onClick={() =>
                        setShowTechnicalNoteArea(!showTechnicalNoteArea)
                      }
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#2c3e50",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        - Fiche Technique (Recette)
                      </h4>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#3498db",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        {showTechnicalNoteArea ? " ➖ Masquer" : " ➕ Afficher"}
                      </span>
                    </div>
                    {showTechnicalNoteArea && (
                      <div className="animate-in" style={{ marginTop: "10px" }}>
                        {/* Affichage des notes précédentes */}
                        {(() => {
                          const selectedClientData = clients.find(
                            (c) => c.nom === client.nom,
                          );
                          const pastNotes =
                            selectedClientData?.notesTechniques || [];
                          if (pastNotes.length > 0) {
                            return (
                              <div
                                style={{
                                  marginBottom: "10px",
                                  fontSize: "11px",
                                  maxHeight: "100px",
                                  overflowY: "auto",
                                }}
                              >
                                {pastNotes.slice(0, 3).map((n, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      padding: "8px",
                                      borderLeft: "3px solid #3498db",
                                      marginBottom: "8px",
                                      background: "white",
                                      borderRadius: "4px",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "3px",
                                      }}
                                    >
                                      <strong style={{ color: "#3498db" }}>
                                        {n.date.split("-").reverse().join("/")}
                                      </strong>
                                    </div>
                                    <div
                                      style={{
                                        color: "#2d3436",
                                        whiteSpace: "pre-wrap",
                                      }}
                                    >
                                      {n.note}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#999",
                                fontStyle: "italic",
                                marginBottom: "10px",
                              }}
                            >
                              Aucun historique technique.
                            </div>
                          );
                        })()}
                        <div style={{ position: "relative" }}>
                          <textarea
                            placeholder="EX: MÉLANGE 30G DE 5.1 + 10G DE 4.0..."
                            value={technicalNote}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setTechnicalNote(val);
                              if (val.trim().length > 1) {
                                const matches = Object.values(catalog).filter(
                                  (c) =>
                                    c.type === "technical" &&
                                    c.nom.toLowerCase().includes(val.toLowerCase()),
                                );
                                setTechnicalSuggestions(matches);
                                setShowTechnicalSuggestions(true);
                              } else {
                                setShowTechnicalSuggestions(false);
                              }
                            }}
                            onFocus={(e) => {
                              if (technicalNote.trim().length > 1 && technicalSuggestions.length > 0) {
                                setShowTechnicalSuggestions(true);
                              }
                            }}
                            onBlur={() => {
                              // Delay hiding to allow click on suggestion
                              setTimeout(() => setShowTechnicalSuggestions(false), 200);
                            }}
                            style={{
                              width: "100%",
                              height: "60px",
                              padding: "10px",
                              borderRadius: "8px",
                              border: "1px solid #ddd",
                              fontSize: "12px",
                              resize: "none",
                              outline: "none",
                              fontFamily: "inherit",
                              textTransform: "uppercase",
                            }}
                          />
                          {showTechnicalSuggestions && technicalSuggestions.length > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                background: "white",
                                border: "1px solid #ddd",
                                borderRadius: "0 0 8px 8px",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                maxHeight: "150px",
                                overflowY: "auto",
                                zIndex: 100,
                              }}
                            >
                              {technicalSuggestions.map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: "8px 10px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    borderBottom: idx < technicalSuggestions.length - 1 ? "1px solid #eee" : "none",
                                    background: "#fff",
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                  onMouseDown={(e) => {
                                    // Prevent blur from firing before onClick
                                    e.preventDefault();
                                  }}
                                  onClick={() => {
                                    // Find the last word being typed and replace it
                                    const words = technicalNote.split(" ");
                                    words.pop(); // remove the partial word
                                    const base = words.length > 0 ? words.join(" ") + " " : "";
                                    setTechnicalNote(base + item.nom + " ");
                                    setShowTechnicalSuggestions(false);
                                  }}
                                >
                                  <span style={{ fontWeight: "bold" }}>{item.nom}</span>
                                  <span style={{ color: "#999", fontSize: "10px" }}>{item.fournisseur}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <button className="pay-btn" onClick={handlePayment}>
                  ENCAISSER
                </button>
              </div>
              <div className="ticket-items">
                <div
                  onClick={() => setShowTicketDétail(!showTicketDétail)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "5px",
                    borderBottom: "1px solid #eee",
                    padding: "8px 0",
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    zIndex: 5,
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      color: "var(--primary)",
                      margin: 0,
                    }}
                  >
                    📄   Détail Ticket
                  </h3>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#3498db",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    {showTicketDétail ? " ➖ Masquer" : " ➕ Afficher"}
                  </span>
                </div>
                {showTicketDétail &&
                  cart.map((item, i) => (
                    <div key={i} className="ticket-line">
                      <span
                        style={{
                          fontSize:
                            item.startsWith("CARTE CADEAU") ||
                              item.startsWith("DIVERS - ")
                              ? "13px"
                              : "inherit",
                          fontWeight:
                            item.startsWith("CARTE CADEAU") ||
                              item.startsWith("DIVERS - ")
                              ? "bold"
                              : "normal",
                          color:
                            item.startsWith("CARTE CADEAU") ||
                              item.startsWith("DIVERS - ")
                              ? "#9b59b6"
                              : "inherit",
                        }}
                      >
                        {item}
                      </span>
                      <div className="line-right">
                        {/* Attribution du personnel par prestation */}
                        <div style={{ display: "flex", gap: "3px", marginRight: "10px" }}>
                          {STAFF_NAMES.map(name => (
                            <button
                              key={name}
                              onClick={() => {
                                setCartStaff(prev => ({ ...prev, [i]: prev[i] === name ? null : name }));
                              }}
                              style={{
                                padding: "2px 6px",
                                fontSize: "10px",
                                borderRadius: "4px",
                                border: "1px solid " + (cartStaff[i] === name ? "var(--primary)" : "#eee"),
                                background: cartStaff[i] === name ? "var(--primary)" : "#f9f9f9",
                                color: cartStaff[i] === name ? "white" : "#999",
                                cursor: "pointer",
                                fontWeight: "bold"
                              }}
                            >
                              {name.charAt(0)}
                            </button>
                          ))}
                        </div>
                        <span
                          onClick={() => {
                            const currentOverride = cartPriceOverrides?.[i];
                            let defaultPrice = 0;
                            if (
                              item.startsWith("CARTE CADEAU - ") ||
                              item.startsWith("DIVERS - ")
                            ) {
                              const parts = item.split(" - ");
                              const priceStr = parts
                                .find((p) => p && p.includes("€"))
                                ?.replace("€", "");
                              defaultPrice = parseFloat(priceStr) || 0;
                            } else {
                              defaultPrice = Number(catalog[item]?.prixVente) || 0;
                            }
                            const currentPrice =
                              currentOverride !== undefined &&
                                currentOverride !== null &&
                                currentOverride !== ""
                                ? parseFloat(currentOverride) || 0
                                : defaultPrice;
                            const input = window.prompt(
                              `Modifier le prix de :\n${item}\n\nPrix actuel : ${currentPrice.toFixed(2)}€ \n\nSaisir le nouveau prix (vide pour annuler):`,
                              (Number(currentPrice) || 0).toFixed(2),
                            );
                            if (input === null) return;
                            const trimmed = String(input).trim();
                            if (trimmed === "") return;
                            const nextPrice = parseFloat(trimmed.replace(",", "."));
                            if (!Number.isFinite(nextPrice)) return;
                            setCartPriceOverrides((prev) => ({
                              ...(prev || {}),
                              [i]: nextPrice,
                            }));
                          }}
                          title="Cliquer pour modifier le prix de cette ligne"
                          style={{
                            cursor: "pointer",
                            textDecoration: "underline",
                            textUnderlineOffset: "2px",
                          }}
                        >
                          {(() => {
                            const override = cartPriceOverrides?.[i];
                            if (
                              override !== undefined &&
                              override !== null &&
                              override !== ""
                            ) {
                              return `${(parseFloat(override) || 0).toFixed(2)}€`;
                            }
                            if (
                              item.startsWith("CARTE CADEAU - ") ||
                              item.startsWith("DIVERS - ")
                            ) {
                              return item.split(" - ").pop();
                            }
                            const p = Number(catalog[item]?.prixVente) || 0;
                            return `${(Number(p) || 0).toFixed(2)}€`;
                          })()}
                        </span>
                        <button
                          onClick={() => removeFromCart(i)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              {/* DERNIERES VENTES UI */}
              <div
                className="ticket-items"
                style={{ marginTop: "5px", borderTop: "1px solid #eee" }}
              >
                <div
                  onClick={() => setShowDailySales(!showDailySales)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "5px",
                    padding: "8px 0",
                    position: "sticky",
                    top: "0px",
                    background: "white",
                    zIndex: 4,
                  }}
                >
                  <h3 style={{ fontSize: "1rem", color: "#2d3436", margin: 0 }}>
                    📊   Ventes du{" "}
                    {selectedDay === new Date().toLocaleDateString("sv-SE")
                      ? "Jour"
                      : new Date(selectedDay).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                  </h3>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#3498db",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    {showDailySales ? " ➖ Masquer" : " ➕ Afficher"}
                  </span>
                </div>
                {showDailySales &&
                  allTransactions
                    .filter((h) => {
                      if (!h || !h.Date) return false;
                      const hDateNorm = normalizeDateToISO(h.Date);
                      return hDateNorm === selectedDay;
                    })
                    .sort((a, b) => (b.Heure || "").localeCompare(a.Heure || ""))
                    .map((h) => (
                      <div
                        key={h.id}
                        style={{
                          background: "#f8f9fa",
                          padding: "10px",
                          borderRadius: "10px",
                          marginBottom: "8px",
                          fontSize: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontWeight: "bold",
                          }}
                        >
                          <span>
                            <span style={{ color: "#7f8c8d", fontSize: "11px", marginRight: "6px" }}>
                              {h.Heure || ""}
                            </span>
                            [{h.caissiere || "?"}] {h.Nom_Client || "Passant"}
                          </span>
                          <span>{(Number(h.Total) || 0).toFixed(2)}€</span>
                        </div>
                        <div
                          style={{
                            color: "#999",
                            fontSize: "10px",
                            marginBottom: "5px",
                          }}
                        >
                          {h && Array.isArray(h.items_names) && h.items_names.length > 0
                            ? h.items_names.join(" • ").substring(0, 40) + "..."
                            : (h.Détails || "").substring(0, 40) + "..."}
                        </div>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button
                            onClick={() => handleEditTransaction(h.id)}
                            style={{
                              flex: 1,
                              padding: "4px",
                              fontSize: "10px",
                              background: "#3498db",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Corriger
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(h.id)}
                            style={{
                              flex: 1,
                              padding: "4px",
                              fontSize: "10px",
                              background: "#e74c3c",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Suppr.
                          </button>
                        </div>
                      </div>
                    ))}
                {allTransactions.filter((h) => normalizeDateToISO(h.Date) === selectedDay).length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#ccc",
                      fontStyle: "italic",
                      padding: "20px",
                    }}
                  >
                    Aucune vente pour cette date
                  </div>
                )}
              </div>
            </div>
          )}
        {/* PAGE HISTORIQUE & IMPRESSION */}
        {activeTab === "EXCEL" && (
          <div className="print-page">
            <h2 style={{ marginBottom: "5px" }}>
              📊 Tableau de Bord Mensuel & Impression
            </h2>
            <p
              style={{
                color: "#666",
                fontSize: "14px",
                marginBottom: "25px",
                textAlign: "center",
              }}
            >
              Suivez vos performances semaine après semaine et gérez vos
              exports.
            </p>
            <div
              style={{
                background: "#e1f5fe",
                color: "#01579b",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px",
                border: "1px solid #b3e5fc",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "24px" }}>⏰</span>
              <div>
                <strong>N'oubliez pas !</strong> Téléchargez le rapport
                journalier tous les soirs pour votre comptabilité.
              </div>
            </div>

            {/* CONFIGURATION DOSSIER DE RAPPORTS */}
            <div
              style={{
                background: "#f0fdf4",
                border: "2px solid #22c55e",
                padding: "20px",
                borderRadius: "20px",
                marginBottom: "30px",
                boxShadow: "0 10px 30px rgba(34, 197, 94, 0.05)",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#166534", display: "flex", alignItems: "center", gap: "10px" }}>
                📁 Configuration de l'enregistrement automatique
              </h3>
              <p style={{ fontSize: "14px", color: "#15803d", marginBottom: "15px" }}>
                Choisissez le dossier racine (ex: "Mes Caisses" sur votre bureau). Les rapports y seront rangés automatiquement par type.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <button
                  className="pay-btn"
                  style={{
                    width: "auto",
                    background: reportsFolderHandle ? "#059669" : "#10b981",
                    margin: 0,
                    padding: "0 20px",
                    height: "45px",
                    borderRadius: "12px",
                  }}
                  onClick={async () => {
                    try {
                      const handle = await window.showDirectoryPicker();
                      setReportsFolderHandle(handle);
                      await saveHandleToIDB(handle, "reports_handle");
                      alert(" ✅ Dossier configuré avec succès ! Vos rapports seront désormais organisés automatiquement.");
                    } catch (err) {
                      if (err.name !== "AbortError") console.error(err);
                    }
                  }}
                >
                  {reportsFolderHandle ? "🔄 Changer de dossier destination" : "📁 Choisir le dossier destination"}
                </button>
                {reportsFolderHandle && (
                  <span style={{ fontSize: "13px", color: "#059669", fontWeight: "600" }}>
                    Dossier : {reportsFolderHandle.name}
                  </span>
                )}
              </div>
            </div>
            {/* RAPPORTS DE STOCK / INVENTAIRE */}
            <div
              style={{
                background: "#fffcf0",
                border: "2px solid #f1c40f",
                padding: "25px",
                borderRadius: "20px",
                marginBottom: "30px",
                boxShadow: "0 10px 30px rgba(241, 196, 15, 0.05)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#b8860b",
                }}
              >
                📦  Rapports de Stock / Inventaire
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  marginBottom: "20px",
                  color: "#856404",
                }}
              >
                Sélectionnez une gamme pour générer le tableau d'inventaire
                (Vente & Technique).
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <select
                  value={selectedGammeForStock}
                  onChange={(e) => setSelectedGammeForStock(e.target.value)}
                  style={{
                    padding: "12px 18px",
                    borderRadius: "12px",
                    border: "2px solid #f1c40f",
                    minWidth: "280px",
                    fontSize: "15px",
                    outline: "none",
                    background: "white",
                  }}
                >
                  <option value="">-- Sélectionner un Fournisseur --</option>
                  {Array.from(
                    new Set(
                      Object.values(catalog)
                        .map((i) => i.fournisseur)
                        .filter(Boolean),
                    ),
                  )
                    .sort()
                    .map((f) => (
                      <option key={f} value={f}>
                        🛍️   {f}
                      </option>
                    ))}
                </select>
                <button
                  className="pay-btn"
                  style={{
                    width: "auto",
                    background: "#f39c12",
                    margin: 0,
                    padding: "0 25px",
                    height: "50px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 15px rgba(243, 156, 18, 0.2)",
                  }}
                  onClick={() => {
                    if (!selectedGammeForStock)
                      return alert("Veuillez sélectionner une gamme.");
                    setPreviewData(
                      generateInventoryReportAOA(selectedGammeForStock),
                    );
                    setPreviewTitle(`Inventaire - ${selectedGammeForStock}`);
                    setShowPreviewModal(true);
                  }}
                >
                  👁️ Aperçu
                </button>
                <button
                  className="pay-btn"
                  style={{
                    width: "auto",
                    background: "#e67e22",
                    margin: 0,
                    padding: "0 25px",
                    height: "50px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 15px rgba(230, 126, 34, 0.2)",
                  }}
                  onClick={() => {
                    if (!selectedGammeForStock)
                      return alert("Veuillez sélectionner une gamme.");
                    exportInventoryExcel(selectedGammeForStock);
                  }}
                >
                  📦  Télécharger Excel
                </button>
              </div>
            </div>
            <div
              className="export-section"
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* BOUTON RESET MOIS MANUEL */}
              {(() => {
                const now = new Date();
                const currentMonthKey =
                  now.getFullYear() +
                  "-" +
                  (now.getMonth() + 1).toString().padStart(2, "0");
                const hasOldData = history.some(
                  (h) => h && h.Date && !normalizeDate(h.Date).startsWith(currentMonthKey),
                );
                if (hasOldData && !activeArchiveMonth) {
                  return (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        padding: "15px",
                        background: "#e74c3c",
                        color: "white",
                        borderRadius: "10px",
                        textAlign: "center",
                        marginBottom: "20px",
                      }}
                    >
                      <h3> ⚠️ Nouveau Mois Détecté</h3>
                      <p>
                        Vous avez des Données du mois précédent. Voulez-vous
                        archiver et commencer le mois actuel ?
                      </p>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Êtes-vous sûr de vouloir clôturer le mois précédent et commencer un nouveau ?\n\nLes données seront archivées dans l'onglet HISTORIQUE."
                            )
                          ) {
                            const distinctMonths = [
                              ...new Set(
                                history.map((h) => normalizeDate(h?.Date || "").substring(0, 7)),
                              ),
                            ];
                            const oldMonths = distinctMonths.filter(
                              (m) => m !== currentMonthKey,
                            );
                            setArchives((prev) => {
                              const updated = { ...prev };
                              oldMonths.forEach((month) => {
                                const monthData = history.filter((h) =>
                                  normalizeDate(h?.Date || "").startsWith(month),
                                );
                                if (monthData.length > 0) {
                                  updated[month] = monthData;
                                }
                              });
                              return updated;
                            });
                            setHistory(prev =>
                              prev.filter((h) =>
                                normalizeDate(h?.Date || "").startsWith(currentMonthKey),
                              ),
                            );
                            alert(
                              "✅ Mois précédent archivé ! Vous êtes prêt pour ce mois-ci.",
                            );
                          }
                        }}
                        style={{
                          background: "white",
                          color: "#e74c3c",
                          padding: "10px 20px",
                          border: "none",
                          fontWeight: "bold",
                          borderRadius: "5px",
                          cursor: "pointer",
                          marginTop: "10px",
                        }}
                      >
                        ✅ Archiver et Commencer le mois
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
              <div
                className="export-card"
                style={{
                  padding: "20px",
                  background: "#f0f7ff",
                  borderRadius: "20px",
                  border: "2px solid #3498db",
                  boxShadow: "0 10px 20px rgba(52, 152, 219, 0.05)",
                }}
              >
                <h3 style={{ margin: "0 0 10px 0", color: "#2980b9" }}>
                  📅 Rapport Journalier
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#5dade2",
                    marginBottom: "15px",
                  }}
                >
                  Sélectionnez un jour spécifique pour l'export.
                </p>
                <div
                  style={{ display: "flex", gap: "10px", marginBottom: "15px" }}
                >
                  <input
                    key={selectedDay}
                    type="date"
                    defaultValue={selectedDay}
                    onBlur={(e) => {
                      if (e.target.value && e.target.value !== selectedDay) {
                        setSelectedDay(e.target.value);
                        setReportViewMode("daily");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value) {
                        setSelectedDay(e.target.value);
                        setReportViewMode("daily");
                      }
                    }}
                    style={{ border: "1px solid #3498db", borderRadius: "8px" }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#e67e22",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  ⏰{" "}
                  {(() => {
                    const now = new Date();
                    const hoursLeft = 24 - now.getHours();
                    return hoursLeft <= 0
                      ? "Journée terminée"
                      : `${hoursLeft} heure(s) avant fin de Journée`;
                  })()}
                </div>
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <button
                    className="pay-btn"
                    onClick={() => handlePrintDailyReport("Perso")}
                    style={{
                      backgroundColor: "#27ae60",
                      padding: "10px",
                      flex: 1,
                      boxShadow: "0 4px 10px rgba(39, 174, 96, 0.2)",
                    }}
                  >
                    📊 Rapport Perso
                  </button>
                  <button
                    className="pay-btn"
                    onClick={() => handlePreviewDaily("Perso")}
                    style={{
                      backgroundColor: "#95a5a6",
                      padding: "10px",
                      width: "auto",
                    }}
                    title="Aperçu"
                  >
                    👁️
                  </button>
                </div>
              </div>
              <div
                className="export-card"
                style={{
                  padding: "20px",
                  background: "#f5f0ff",
                  borderRadius: "20px",
                  border: "2px solid #9b59b6",
                  boxShadow: "0 10px 20px rgba(155, 89, 182, 0.05)",
                }}
              >
                <h3 style={{ margin: "0 0 10px 0", color: "#8e44ad" }}>
                  📈 Rapport Mensuel
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#af7ac5",
                    marginBottom: "15px",
                  }}
                >
                  Historique complet du mois sélectionné.
                </p>
                <div
                  style={{ display: "flex", gap: "10px", marginBottom: "15px" }}
                >
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setReportViewMode("monthly");
                    }}
                    style={{ border: "1px solid #9b59b6", borderRadius: "8px" }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#e67e22",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  {(() => {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    const currentMonth = now.getMonth();
                    const selectedDate = new Date(selectedMonth);
                    if (
                      selectedDate.getMonth() === currentMonth &&
                      selectedDate.getFullYear() === currentYear
                    ) {
                      const daysInMonth = new Date(
                        currentYear,
                        currentMonth + 1,
                        0,
                      ).getDate();
                      const daysLeft = daysInMonth - now.getDate();
                      return daysLeft <= 0
                        ? "Mois terminé ! Prêt pour l'export."
                        : `${daysLeft} jour(s) avant la fin du mois`;
                    }
                    return "Mois clôturé";
                  })()}
                </div>
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <button
                    className="pay-btn"
                    onClick={() => handlePrintMonthlyReport("Comptabilité")}
                    style={{
                      backgroundColor: "#8e44ad",
                      padding: "10px",
                      flex: 1,
                      boxShadow: "0 4px 10px rgba(142, 68, 173, 0.2)",
                    }}
                  >
                    📑 Compta
                  </button>
                  <button
                    className="pay-btn"
                    onClick={() => handlePreviewMonthly("Comptabilité")}
                    style={{
                      backgroundColor: "#95a5a6",
                      padding: "10px",
                      width: "auto",
                    }}
                    title="Aperçu"
                  >
                    👁️
                  </button>
                </div>
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <button
                    className="pay-btn"
                    onClick={() => handlePrintMonthlyReport("Perso")}
                    style={{
                      backgroundColor: "#16a085",
                      padding: "10px",
                      flex: 1,
                      boxShadow: "0 4px 10px rgba(22, 160, 133, 0.2)",
                    }}
                  >
                    📊 Perso
                  </button>
                  <button
                    className="pay-btn"
                    onClick={() => handlePreviewMonthly("Perso")}
                    style={{
                      backgroundColor: "#95a5a6",
                      padding: "10px",
                      width: "auto",
                    }}
                    title="Aperçu"
                  >
                    👁️
                  </button>
                </div>
              </div>
            </div>
            {/* EXCEL PREVIEW MODAL */}
            {showPreviewModal && previewData && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(0,0,0,0.85)",
                  zIndex: 9999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => setShowPreviewModal(false)}
              >
                <div
                  style={{
                    background: "white",
                    borderRadius: "15px",
                    width: "98%",
                    height: "94%",
                    maxWidth: "1800px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div
                    style={{
                      padding: "20px",
                      borderBottom: "1px solid #eee",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#f8f9fa",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          margin: 0,
                          color: "#2d3436",
                          fontSize: "20px",
                        }}
                      >
                        {previewTitle}
                      </h2>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#636e72",
                          marginTop: "5px",
                        }}
                      >
                        Aperçu avant impression
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      style={{
                        background: "#e74c3c",
                        color: "white",
                        border: "none",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      ✖
                    </button>
                  </div>
                  {/* Content (Scrollable) */}
                  <div style={{ flex: 1, overflow: "auto", padding: "10px" }}>
                    <table
                      style={{
                        borderCollapse: "collapse",
                        width: "100%",
                        fontSize: "11px",
                        fontFamily: "Arial, sans-serif",
                        zoom: "0.85",
                      }}
                    >
                      <tbody>
                        {previewData.map((row, rIndex) => (
                          <tr
                            key={rIndex}
                            style={{
                              background:
                                rIndex === 0 ||
                                  row[0] === "TOTAL" ||
                                  row[0] === "Total mois" ||
                                  row[0] === "Total semaine"
                                  ? "#f1f2f6"
                                  : rIndex % 2 === 0
                                    ? "white"
                                    : "#fcfcfc",
                            }}
                          >
                            {row.map((cell, cIndex) => (
                              <td
                                key={cIndex}
                                style={{
                                  border: "1px solid #dfe6e9",
                                  padding: "6px 8px",
                                  fontWeight:
                                    rIndex === 0 ||
                                      row[0] === "TOTAL" ||
                                      row[0] === "Total mois" ||
                                      row[0] === "Total semaine"
                                      ? "bold"
                                      : "normal",
                                  textAlign:
                                    typeof cell === "number" ||
                                      (typeof cell === "string" &&
                                        !isNaN(parseFloat(cell)) &&
                                        !cell.includes("+"))
                                      ? "center"
                                      : "left",
                                  whiteSpace: "nowrap", // Force une seule ligne comme demandé
                                  maxWidth: "none",
                                  lineHeight: "1.4",
                                }}
                              >
                                {(() => {
                                  if (
                                    typeof cell === "object" &&
                                    cell !== null
                                  ) {
                                    const rawVal = cell.v ?? 0;
                                    const valNum = Number(rawVal);
                                    const val = Number.isFinite(valNum)
                                      ? valNum.toFixed(2)
                                      : rawVal;
                                    if (cell.z) {
                                      // Extraire les suffixes entre guillemets du format Excel (ex: # ##0"€ ")
                                      const matches = [
                                        ...String(cell.z).matchAll(
                                          /"([^"]+)"/g,
                                        ),
                                      ];
                                      const suffix = matches
                                        .map((m) => m[1])
                                        .join("");
                                      return `${val}${suffix}`;
                                    }
                                    return val;
                                  }
                                  if (typeof cell === "number") return cell.toFixed(2);
                                  if (typeof cell === "string") {
                                    const s = cell.trim();
                                    const isNumeric =
                                      s !== "" &&
                                      !s.includes("+") &&
                                      !s.includes("/") &&
                                      !s.toLowerCase().includes("dont") &&
                                      !Number.isNaN(
                                        Number(s.replace(/\s/g, "").replace(",", ".")),
                                      );
                                    if (isNumeric) {
                                      const n = Number(
                                        s.replace(/\s/g, "").replace(",", "."),
                                      );
                                      if (Number.isFinite(n)) return n.toFixed(2);
                                    }
                                  }
                                  return cell;
                                })()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer */}
                  <div
                    style={{
                      padding: "15px",
                      background: "#f8f9fa",
                      borderTop: "1px solid #eee",
                      textAlign: "right",
                    }}
                  >
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      style={{
                        background: "#2d3436",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "5px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Fermer l'aperçu
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div
              className="recap-container"
              style={{
                width: "100%",
                marginTop: "20px",
                background: "white",
                padding: "25px",
                borderRadius: "20px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
              }}
            >
              <h3
                style={{
                  borderBottom: "3px solid",
                  borderImage: "linear-gradient(to right, #00bfff, #ff1493) 1",
                  display: "inline-block",
                  paddingBottom: "5px",
                }}
              >
                📊 {reportViewMode === "daily" ? `Détail du Jour (${selectedDay})` : `Statistiques Hebdomadaires (${selectedMonth})`}
              </h3>
              <WeeklyChart data={getWeeklyRecap()} />
              {/* TABLEAU RÉCAPITULATIF DÉTAILL ? */}
              <div style={{ marginTop: "25px", overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                    textAlign: "center",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8f9fa", color: "#7f8c8d" }}>
                      <th
                        style={{
                          padding: "12px",
                          borderBottom: "2px solid #eee",
                        }}
                      >
                        Période
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          borderBottom: "2px solid #eee",
                          color: "#27ae60",
                        }}
                      >
                        Chiffre d'Affaires
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          borderBottom: "2px solid #eee",
                          color: "#3498db",
                        }}
                      >
                        Nombre Clients
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          borderBottom: "2px solid #eee",
                          color: "#9b59b6",
                        }}
                      >
                        Ventes Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const recap = getWeeklyRecap();
                      if (reportViewMode === "daily") {
                        // En mode journalier, on ne montre qu'un seul "groupe" qui est le jour sélectionné
                        const dayTrans = allTransactions.filter(h => normalizeDateToISO(h.Date) === selectedDay);
                        const total = dayTrans.reduce((s, h) => s + (Number(h.Total) || 0), 0);
                        const stockCount = dayTrans.reduce((s, h) => {
                          let c = 0;
                          (h.items_names || []).forEach(n => { if (catalog[n]?.type === "retail") c++; });
                          return s + c;
                        }, 0);
                        const uniqueClients = new Set(dayTrans.map(h => `${h.Nom_Client}_${h.Numero_Client}`));

                        const dayObj = {
                          name: `Ventes du ${new Date(selectedDay).toLocaleDateString("fr-FR")}`,
                          total,
                          clients: uniqueClients.size,
                          stock: stockCount,
                          transactions: dayTrans,
                          cashiers: dayTrans.reduce((acc, h) => {
                            const c = h.caissiere || "(?)";
                            acc[c] = (acc[c] || 0) + (Number(h.Total) || 0);
                            return acc;
                          }, {})
                        };
                        return [dayObj];
                      }
                      return recap;
                    })().map((w, i) => (
                      <React.Fragment key={i}>
                        <tr
                          onClick={() => {
                            if (reportViewMode === "daily") return; // Always expanded or static in daily mode? No, let's keep toggle if transactions exists
                            setExpandedWeek(expandedWeek === i ? null : i);
                          }}
                          style={{
                            borderBottom: "1px solid #eee",
                            background:
                              w.transactions.length > 0 ? "#fff" : "#fafafa",
                            cursor:
                              w.transactions.length > 0 ? "pointer" : "default",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              fontWeight: "bold",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "5px",
                            }}
                          >
                            {w.transactions.length > 0 && (
                              <span style={{ fontSize: "10px" }}>
                                {expandedWeek === i ? "▲" : "▼"}
                              </span>
                            )}
                            {w.name}
                          </td>
                          <td style={{ padding: "12px", fontWeight: "bold" }}>
                            {(Number(w.total) || 0).toFixed(2)}€
                          </td>
                          <td style={{ padding: "12px" }}>
                            {w.clients} clients
                          </td>
                          <td style={{ padding: "12px" }}>
                            {w.stock} articlés
                          </td>
                        </tr>
                        {(reportViewMode === "daily" || expandedWeek === i) && w.transactions.length > 0 && (
                          <tr className="animate-in">
                            <td
                              colSpan="4"
                              style={{ padding: "0 20px 15px 20px" }}
                            >
                              <div
                                style={{
                                  background: "#f9f9f9",
                                  borderRadius: "10px",
                                  padding: "10px",
                                  textAlign: "left",
                                  border: "1px solid #eee",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    color: "#666",
                                    marginBottom: "8px",
                                    borderBottom: "1px solid #eee",
                                    paddingBottom: "5px",
                                  }}
                                >
                                  Détails des clients - {w.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#2c3e50",
                                    marginBottom: "10px",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "10px",
                                  }}
                                >
                                  {Object.entries(w.cashiers || {})
                                    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                                    .map(([n, total]) => (
                                      <div
                                        key={n}
                                        style={{
                                          background: "#fff",
                                          border: "1px solid #eee",
                                          padding: "6px 10px",
                                          borderRadius: "999px",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {n} : {(Number(total) || 0).toFixed(2)} €                                      </div>
                                    ))}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                  }}
                                >
                                  {w.transactions.map((t) => (
                                    <div
                                      key={t.id}
                                      style={{
                                        background: "white",
                                        padding: "10px 15px",
                                        borderRadius: "10px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        border: "1px solid #f0f0f0",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "20px",
                                          flex: 1,
                                        }}
                                      >
                                        <div style={{ minWidth: "150px" }}>
                                          <div
                                            style={{
                                              fontWeight: "800",
                                              fontSize: "14px",
                                              color: "#2d3436",
                                            }}
                                          >
                                            {t.Nom_Client || "Passant"}
                                            <span style={{ fontSize: "11px", color: "#8e44ad", fontWeight: "bold", marginLeft: "10px" }}>[{t.caissiere || "?"}]</span>
                                            <span
                                              style={{
                                                fontSize: "11px",
                                                fontWeight: "bold",
                                                color: "#e67e22",
                                                marginLeft: "8px",
                                              }}
                                            >
                                              {t.Heure || ""}
                                            </span>
                                            <span
                                              style={{
                                                fontSize: "11px",
                                                fontWeight: "normal",
                                                color: "#999",
                                                marginLeft: "8px",
                                              }}
                                            >
                                              ({
                                                t.Date && t.Date.includes("/") ? t.Date.split("/").slice(0, 2).join("/") :
                                                  (t.Date && t.Date.split("-").length === 3 ? `${t.Date.split("-")[2]}/${t.Date.split("-")[1]}` : (t.Date || ""))
                                              })
                                            </span>
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "11px",
                                              color: "#999",
                                            }}
                                          >
                                            Tel:{" "}
                                            {t.Numero_Client || "Non renseigné"}
                                          </div>
                                        </div>
                                        <div
                                          style={{
                                            color: "#27ae60",
                                            fontWeight: "900",
                                            fontSize: "15px",
                                            minWidth: "80px",
                                          }}
                                        >
                                          {(Number(t.Total) || 0).toFixed(2)}€
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            color: "#636e72",
                                            fontStyle: "normal",
                                            display: isMobile
                                              ? "none"
                                              : "block",
                                            wordBreak: "break-word",
                                            flex: 1,
                                          }}
                                        >
                                          <span style={{ fontWeight: "bold", color: "#8e44ad", marginRight: "5px" }}>[{t.caissiere || "?"}]</span>
                                          {t && Array.isArray(t.items_names) && t.items_names.length > 0
                                            ? t.items_names.join(" • ")
                                            : t.Détails}
                                        </div>
                                      </div>
                                      <div
                                        style={{ display: "flex", gap: "8px" }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditTransaction(t.id);
                                          }}
                                          style={{
                                            padding: "8px 12px",
                                            background: "#3498db",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px",
                                            fontSize: "12px",
                                            fontWeight: "bold",
                                            boxShadow:
                                              "0 2px 4px rgba(52, 152, 219, 0.2)",
                                          }}
                                        >
                                          ✏️ Modifier
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTransaction(t.id);
                                          }}
                                          style={{
                                            padding: "8px 12px",
                                            background: "#e74c3c",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px",
                                            fontSize: "12px",
                                            fontWeight: "bold",
                                            boxShadow:
                                              "0 2px 4px rgba(231, 76, 60, 0.2)",
                                          }}
                                        >
                                          🗑️ Supprimer
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {/* LIGNE TOTAL MOIS */}
                    <tr style={{ background: "#f0faff", fontWeight: "bold" }}>
                      <td style={{ padding: "12px" }}>TOTAL MOIS</td>
                      <td style={{ padding: "12px", color: "#27ae60" }}>
                        {getWeeklyRecap()
                          .reduce((sum, w) => sum + w.total, 0)
                          .toFixed(2)}{" "}
                        €                      </td>
                      <td style={{ padding: "12px" }}>
                        {getWeeklyRecap().reduce(
                          (sum, w) => sum + w.clients,
                          0,
                        )}{" "}
                        clients
                      </td>
                      <td style={{ padding: "12px" }}>
                        {getWeeklyRecap().reduce((sum, w) => sum + w.stock, 0)}{" "}
                        articlés
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: "30px" }}>
              <DataAnalytics
                history={history}
                archives={archives}
                selectedDay={selectedDay}
                selectedMonth={selectedMonth}
                catalog={catalog}
                missions={missions}
                isMobile={isMobile}
                handleDeleteTransaction={handleDeleteTransaction}
                handleEditTransaction={handleEditTransaction}
                activeArchiveMonth={activeArchiveMonth}
              />
            </div>
          </div>
        )}
        {activeTab === "HISTORIQUE DES ARCHIVES" && renderArchivesTab()}
        {activeTab === "MISSIONS" && renderMissionsTab()}
      </div>{" "}
      {/* main-content */}
      {showScannerModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.8)",
            zIndex: 10000,
            display: "flex",
            alignItems: "flex-start",
            padding: "20px",
            overflowY: "auto",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "25px",
              width: "90%",
              maxWidth: "450px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <h2 style={{ color: "var(--primary)", margin: 0 }}>
                📦  Scanner Smartphone
              </h2>
              <button
                onClick={() => {
                  setShowScannerModal(false);
                  setReceivedScans([]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#999",
                  cursor: "pointer",
                  padding: "5px",
                  lineHeight: 1,
                }}
              >
                ❌
              </button>
            </div>
            <div
              style={{
                background: "#fef9e7",
                padding: "15px",
                borderRadius: "15px",
                fontSize: "14px",
                color: "#d35400",
                marginBottom: "20px",
                border: "2px solid #f39c12",
                fontWeight: "bold",
              }}
            >
              ⚠️ IMPORTANT : Votre PC et votre téléphone doivent être sur le MÊME
              WIFI.
              <br />
              Vérifiez que l'IP ci-dessous est bien celle de votre ordinateur.
            </div>
            <div style={{ marginBottom: "15px" }}>
              <input
                placeholder="IP de votre PC (ex: 192.168.1.10)"
                value={scannerIp}
                onChange={(e) => setScannerIp(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  width: "80%",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              />
              <div
                style={{
                  fontSize: "14px",
                  color: "#e67e22",
                  marginTop: "15px",
                  fontStyle: "italic",
                  maxWidth: "350px",
                  margin: "15px auto",
                  background: "#fff4e5",
                  padding: "15px",
                  borderRadius: "15px",
                  border: "3px solid #ffcc80",
                  fontWeight: "bold",
                }}
              >
                ⚠️   ÉTAPE INDISPENSABLE :<br />
                0. Trouvez l'IP de votre PC (Tapez <strong>ipconfig</strong> dans
                une console Windows).<br />
                1. Entrez cette IP dans la case ci-dessus.<br />
                2. Scannez le QR Code.<br />
                3. Si une erreur s'affiche, cliquez sur{" "}
                <strong>"Paramètres avancés"</strong>.<br />
                4. Cliquez sur{" "}
                <strong>"Continuer vers le site (non sécurisé)"</strong>.
              </div>
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => {
                    const protocol = window.location.protocol;
                    const currentPort = window.location.port;
                    const url = `${protocol}//${scannerIp.replace(/\s+/g, "")}:${currentPort}?mode=scanner&peerId=${peerId}#scanner?peerId=${peerId}`;
                    window.open(url, "_blank");
                  }}
                  style={{
                    fontSize: "12px",
                    background: "#eee",
                    color: "#666",
                    border: "1px solid #ccc",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  🔄 Mode Classique (HTTP) - Si HTTPS ne marche pas
                </button>
                <p
                  style={{ fontSize: "10px", color: "#999", marginTop: "5px" }}
                >
                  (Le mode Classique peut ne pas ouvrir la caméra sur certains
                  téléphones)
                </p>
              </div>
            </div>
            {peerId ? (
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "15px",
                  display: "inline-block",
                }}
              >
                <QRCodeCanvas
                  value={`${window.location.protocol}//${scannerIp.replace(/\s+/g, "")}:${window.location.port}?mode=scanner&peerId=${peerId}#scanner?peerId=${peerId}`}
                  size={200}
                />
              </div>
            ) : (
              <p>Initialisation...</p>
            )}
            <div
              style={{
                marginTop: "20px",
                color: remoteConn ? "#2ecc71" : "#999",
                fontWeight: "bold",
                marginBottom: "15px",
              }}
            >
              {remoteConn
                ? " ✅ Téléphone Connecté !"
                : "⏳ En attente de connexion..."}
            </div>
            {receivedScans.length > 0 &&
              (() => {
                const barcode = receivedScans[0].barcode;
                const name = Object.keys(catalog).find(
                  (n) => catalog[n].barcode === barcode,
                );
                return (
                  <div
                    onClick={() => {
                      if (name) {
                        startEditStockItem(name);
                      } else {
                        setIsRecordingInvoice(true);
                        setIsAddingNewProduct(true);
                        setNewItemState((prev) => ({
                          ...prev,
                          barcode: barcode,
                        }));
                      }
                      setShowScannerModal(false);
                      setReceivedScans([]);
                      if (!name) {
                        setTimeout(() => {
                          document.getElementById("new-item-name")?.focus();
                        }, 100);
                      }
                    }}
                    style={{
                      textAlign: "center",
                      marginTop: "10px",
                      padding: "15px",
                      borderRadius: "15px",
                      background: name ? "#eafaf1" : "#fef9e7",
                      border: `2px solid ${name ? "#2ecc71" : "#f39c12"}`,
                      marginBottom: "15px",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.transform = "scale(1.02)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    {name ? (
                      <div style={{ color: "#27ae60" }}>
                        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                          ✅ PRODUIT EXISTANT (Cliquez pour modifier)
                        </div>
                        <div style={{ fontSize: "14px" }}>{name}</div>
                      </div>
                    ) : (
                      <div style={{ color: "#d35400" }}>
                        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                          ➕ NOUVEAU PRODUIT (Cliquez pour créer)
                        </div>
                        <div style={{ fontSize: "14px" }}>
                          Code scanné : {barcode}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            {receivedScans.length > 0 && (
              <div
                style={{
                  textAlign: "left",
                  marginTop: "10px",
                  borderTop: "1px solid #eee",
                  paddingTop: "15px",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "10px",
                  }}
                >
                  📦  Scans Récents (Cliquez pour utiliser)
                </h3>
                <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                  {receivedScans.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        const existingName = Object.keys(catalog).find(
                          (n) => catalog[n].barcode === s.barcode,
                        );
                        if (existingName) {
                          startEditStockItem(existingName);
                        } else {
                          setIsRecordingInvoice(true);
                          setIsAddingNewProduct(true);
                          setNewItemState((prev) => ({
                            ...prev,
                            barcode: s.barcode,
                          }));
                        }
                        setShowScannerModal(false);
                        setReceivedScans([]);
                        if (!existingName) {
                          setTimeout(() => {
                            document.getElementById("new-item-name")?.focus();
                          }, 100);
                        }
                      }}
                      style={{
                        padding: "10px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        marginBottom: "5px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "13px",
                        border: "1px solid #eee",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#eef2f7")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "#f8f9fa")
                      }
                    >
                      <strong style={{ color: "var(--primary)" }}>
                        {s.barcode}
                      </strong>
                      <span style={{ color: "#999", fontSize: "11px" }}>
                        {s.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              className="pay-btn"
              style={{
                marginTop: "20px",
                background: "#e74c3c",
                color: "white",
              }}
              onClick={() => {
                setShowScannerModal(false);
                setReceivedScans([]);
              }}
            >
              Annuler / Fermer
            </button>
          </div>
        </div>
      )}
      {renderGiftCardModal()}
      {renderClientModal()}

    </div>
  );
};

const App = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isRemoteScanner =
    urlParams.get("mode") === "scanner" || window.location.hash === "#scanner";
  const targetPeerId =
    urlParams.get("peerId") || window.location.hash.split("peerId=")[1];

  if (isRemoteScanner && targetPeerId) {
    return (
      <ErrorBoundary>
        <RemoteScanner peerId={targetPeerId} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
};
export default App;
