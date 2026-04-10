import React from "react";
import path from "path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

/* =========================
   Font
========================= */
Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/Inter-Bold.ttf"), fontWeight: 700 },
  ],
});

/* =========================
   Types
========================= */
type Party = {
  name?: string;
  taxId?: string;
  address?: string;
  iban?: string;
  bank?: string;
  phone?: string;
  email?: string;
  signName?: string;
};

type InvoicePDFData = {
  number: string;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  notes?: string | null;

  seller: Party;
  buyer: Party;

  items: {
    name: string;
    description?: string | null;
    qty: number;
    price: number;
    amount: number;
  }[];

  total: number;
};

/* =========================
   Styles
========================= */
const BLUE = "#1f5ea8";

const s = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Inter",
    color: "#111",
  },

  title: { fontSize: 22, fontWeight: 700 },
  titleLine: { height: 2, backgroundColor: BLUE, marginTop: 6, marginBottom: 14 },

  // Layout
  block: { marginBottom: 20 },
  row: { flexDirection: "row" },

  // ✅ ширше, щоб не було переносу 1 символа (як твоя "5")
  labelCol: { width: 150 },

  valueCol: { flexGrow: 1 },
  label: { fontWeight: 700 },

  // ✅ максимально "текстовий" стиль, щільно
  line: { lineHeight: 0.9 }, // ще щільніше
  invTitleBox: { alignItems: "center", marginTop: 10, marginBottom: 10 },

  // ✅ різні відступи як ти просив
  invTitle: { fontSize: 14, fontWeight: 700, lineHeight: 1.1, marginBottom: 10 }, // більший відступ ДО "від"
  invSub: { lineHeight: 0.9, marginTop: 0 }, // без повітря між підрядками
  invSubTight: { lineHeight: 0.9 }, // менший відступ між "від" і "Підлягає"

  // Table
  table: { borderWidth: 1, borderColor: "#d9d9d9" },
  trHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#d9d9d9",
    backgroundColor: "#f7f7f7",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  cNo: { width: 24 },
  cDesc: { flexGrow: 1 },
  cQty: { width: 70, textAlign: "right" },
  cPrice: { width: 80, textAlign: "right" },
  cSum: { width: 90, textAlign: "right" },

  bold: { fontWeight: 700 },

  sumWords: { marginTop: 10, fontWeight: 700, lineHeight: 1.15 },

  totalBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    padding: 8,
    width: 340,
    alignSelf: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  signRow: { marginTop: 18, flexDirection: "row", alignItems: "center" },
  signLabel: { width: 70, fontWeight: 700 },
  signLine: {
    flexGrow: 1,
    borderBottomWidth: 1,
    borderColor: "#444",
    marginHorizontal: 10,
    height: 12,
  },
  signName: { width: 140, textAlign: "right", fontWeight: 700 },

  notes: { marginTop: 8, fontWeight: 700, lineHeight: 1.15 },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#444",
  },
});

/* =========================
   Helpers
========================= */
function stripTrailingYearSuffix(s: string) {
  // якщо форматер раптом дасть "р." - прибираємо
  return s.replace(/\sр\.\s*$/u, "");
}

function fmtDateUA(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  const raw = new Intl.DateTimeFormat("uk-UA", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(dt);
  return stripTrailingYearSuffix(raw);
}

function money(n: number) {
  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// сума прописом для UAH (гривні/копійки)
function amountToWordsUAH(total: number) {
  const hryvnias = Math.floor(total + 1e-9);
  const kop = Math.round((total - hryvnias) * 100);

  const onesM = ["нуль", "один", "два", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять"];
  const onesF = ["нуль", "одна", "дві", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять"];
  const teens = ["десять", "одинадцять", "дванадцять", "тринадцять", "чотирнадцять", "п'ятнадцять", "шістнадцять", "сімнадцять", "вісімнадцять", "дев'ятнадцять"];
  const tens = ["", "", "двадцять", "тридцять", "сорок", "п'ятдесят", "шістдесят", "сімдесят", "вісімдесят", "дев'яносто"];
  const hundreds = ["", "сто", "двісті", "триста", "чотириста", "п'ятсот", "шістсот", "сімсот", "вісімсот", "дев'ятсот"];

  function morph(n: number, f1: string, f2: string, f5: string) {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n100 >= 11 && n100 <= 19) return f5;
    if (n10 === 1) return f1;
    if (n10 >= 2 && n10 <= 4) return f2;
    return f5;
  }

  function triadToWords(n: number, female: boolean) {
    const o = female ? onesF : onesM;
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    const parts: string[] = [];
    if (h) parts.push(hundreds[h]);
    if (t === 1) parts.push(teens[u]);
    else {
      if (t) parts.push(tens[t]);
      if (u) parts.push(o[u]);
    }
    if (!parts.length) parts.push("нуль");
    return parts.join(" ");
  }

  const parts: string[] = [];
  const millions = Math.floor(hryvnias / 1_000_000);
  const thousands = Math.floor((hryvnias % 1_000_000) / 1000);
  const rest = hryvnias % 1000;

  if (millions) {
    parts.push(triadToWords(millions, false));
    parts.push(morph(millions, "мільйон", "мільйони", "мільйонів"));
  }
  if (thousands) {
    parts.push(triadToWords(thousands, true));
    parts.push(morph(thousands, "тисяча", "тисячі", "тисяч"));
  }
  if (rest || (!millions && !thousands)) parts.push(triadToWords(rest, false));

  const hryvWord = morph(hryvnias, "гривня", "гривні", "гривень");
  const kopStr = String(kop).padStart(2, "0");
  return `${parts.join(" ")} ${hryvWord} ${kopStr} копійок`;
}

/* =========================
   Component
========================= */
export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  const seller = data.seller ?? {};
  const buyer = data.buyer ?? {};

  const sumWords =
    (data.currency || "UAH") === "UAH"
      ? `Всього на суму: ${amountToWordsUAH(data.total)}`
      : `Всього на суму: ${money(data.total)} ${data.currency}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>РАХУНОК-ФАКТУРА</Text>
        <View style={s.titleLine} />

        {/* Seller */}
        <View style={[s.block, s.row]}>
          <Text style={[s.labelCol, s.label]}>Постачальник</Text>
          <View style={s.valueCol}>
            <Text style={[s.line, s.bold]}>{seller.name ?? ""}</Text>

            {!!seller.address && (
              <Text style={s.line}>
                <Text style={s.bold}>Адреса:</Text> {seller.address}
              </Text>
            )}

            {!!seller.taxId && (
              <Text style={s.line}>
                <Text style={s.bold}>ЄДРПОУ або ІПН:</Text> {seller.taxId}
              </Text>
            )}

            {(seller.iban || seller.bank) && (
              <Text style={s.line}>
                <Text style={s.bold}>Р/р:</Text> {seller.iban ?? ""}{" "}
                {!!seller.bank && (
                  <>
                    | <Text style={s.bold}>МФО:</Text> {seller.bank}
                  </>
                )}
              </Text>
            )}
          </View>
        </View>

        {/* Buyer */}
        <View style={[s.block, s.row]}>
          <Text style={[s.labelCol, s.label]}>Одержувач</Text>
          <View style={s.valueCol}>
            <Text style={[s.line, s.bold]}>{buyer.name ?? ""}</Text>

            {!!buyer.taxId && (
              <Text style={s.line}>
                <Text style={s.bold}>ЄДРПОУ або ІПН:</Text> {buyer.taxId}
              </Text>
            )}

            {!!buyer.address && (
              <Text style={s.line}>
                <Text style={s.bold}>Адреса:</Text> {buyer.address}
              </Text>
            )}
          </View>
        </View>

        {/* Invoice title */}
        <View style={s.invTitleBox}>
          <Text style={s.invTitle}>РАХУНОК-ФАКТУРА № {data.number}</Text>

          {/* ✅ "р." тільки один раз */}
          <Text style={s.invSub}>від {fmtDateUA(data.issueDate)} р.</Text>

          {/* ✅ менший відступ між рядками тут */}
          {data.dueDate && (
            <Text style={s.invSubTight}>Підлягає сплаті до {fmtDateUA(data.dueDate)} р.</Text>
          )}
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.cNo, s.bold]}>№</Text>
            <Text style={[s.cDesc, s.bold]}>Опис</Text>
            <Text style={[s.cQty, s.bold]}>Кількість</Text>
            <Text style={[s.cPrice, s.bold]}>Ціна</Text>
            <Text style={[s.cSum, s.bold]}>Сума</Text>
          </View>

          {data.items.map((it, i) => (
            <View key={i} style={s.tr}>
              <Text style={[s.cNo, s.bold]}>{i + 1}</Text>
              <Text style={[s.cDesc, s.bold]}>{it.name}</Text>
              <Text style={[s.cQty, s.bold]}>{money(it.qty)}</Text>
              <Text style={[s.cPrice, s.bold]}>{money(it.price)}</Text>
              <Text style={[s.cSum, s.bold]}>{money(it.amount)}</Text>
            </View>
          ))}
        </View>

        {/* ✅ повернули суму прописом */}
        <Text style={s.sumWords}>{sumWords}</Text>

        <View style={s.totalBox}>
          <Text style={s.bold}>Загальна сума до оплати:</Text>
          <Text style={s.bold}>{money(data.total)} грн</Text>
        </View>

        <View style={s.signRow}>
          <Text style={s.signLabel}>Виписав</Text>
          <View style={s.signLine} />
          <Text style={s.signName}>{seller.signName ?? ""}</Text>
        </View>

        {!!data.notes && <Text style={s.notes}>Примітка: {data.notes}</Text>}

        {/* Footer contacts (page corners) */}
        <View style={s.footer}>
          <Text>{seller.phone ?? ""}</Text>
          <Text>{seller.email ?? ""}</Text>
        </View>
      </Page>
    </Document>
  );
}
