"use client";
import { PDFDownloadLink, Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import { BriefData, Source } from "@/types/brief";
const s = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", fontSize: 8, color: "#17202a" },
  top: { borderBottom: 2, borderBottomColor: "#ef4b23", paddingBottom: 12, marginBottom: 14 },
  kicker: { fontSize: 7, color: "#ef4b23", letterSpacing: 2 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 5 },
  meta: { color: "#69727d", marginTop: 4 },
  row: { flexDirection: "row", gap: 18 },
  col: { flex: 1 },
  section: { marginBottom: 14 },
  heading: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottom: 1,
    borderBottomColor: "#dfe3e7",
    paddingBottom: 4,
    marginBottom: 6,
  },
  item: { marginBottom: 6 },
  strong: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  body: { lineHeight: 1.15, marginTop: 1 },
  source: { color: "#d84220", fontSize: 7, marginTop: 1 },
  signal: {
    backgroundColor: "#f3f5f6",
    padding: 6,
    marginBottom: 4,
    borderLeft: 2,
    borderLeftColor: "#ef4b23",
  },
  fleetMeta: { color: "#69727d", fontSize: 7, marginTop: 1 },
  footer: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 22,
    color: "#7d8790",
    fontSize: 7,
    borderTop: 1,
    borderTopColor: "#dfe3e7",
    paddingTop: 6,
  },
});
const SourceLink = ({ source }: { source: Source }) => (
  <Link src={source.url} style={s.source}>
    Source: {source.label}
  </Link>
);
export function BriefDocument({ data }: { data: BriefData }) {
  const d = data.department;
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.top}>
          <Text style={s.kicker}>GARAGE / PRE-CALL BRIEF</Text>
          <Text style={s.title}>{d.name}</Text>
          <Text style={s.meta}>
            {d.address}
            {d.phone ? `  •  ${d.phone}` : ""}
          </Text>
          <SourceLink source={d.source} />
        </View>
        <View style={s.section}>
          <Text style={s.heading}>Why call now</Text>
          {data.callSignals.map((x, i) => (
            <View style={s.signal} key={i}>
              <Text style={s.strong}>{x.headline}</Text>
              <Text style={s.body}>{x.detail}</Text>
              <SourceLink source={x.source} />
            </View>
          ))}
        </View>
        <View style={s.row}>
          <View style={s.col}>
            <View style={s.section}>
              <Text style={s.heading}>People</Text>
              {data.leadership.map((x, i) => (
                <View style={s.item} key={i}>
                  <Text style={s.strong}>{x.name}</Text>
                  <Text>{x.title}</Text>
                  <SourceLink source={x.source} />
                </View>
              ))}
            </View>
            <View style={s.section}>
              <Text style={s.heading}>Funding</Text>
              {data.grants.slice(0, 4).map((x, i) => (
                <View style={s.item} key={i}>
                  <Text style={s.strong}>
                    {x.amount} · FY{x.fiscalYear}
                  </Text>
                  <Text>{x.program}</Text>
                  <SourceLink source={x.source} />
                </View>
              ))}
            </View>
          </View>
          <View style={s.col}>
            <View style={s.section}>
              <Text style={s.heading}>Fleet signals</Text>
              {data.fleet.slice(0, 7).map((x, i) => (
                <View style={s.item} key={i}>
                  <Text style={s.strong}>{x.description}</Text>
                  {x.year && (
                    <Text style={s.fleetMeta}>
                      Model year {x.year} · {new Date().getFullYear() - x.year} years old
                      {x.acquiredYear ? ` · Acquired ${x.acquiredYear}` : ""}
                    </Text>
                  )}
                  <SourceLink source={x.source} />
                </View>
              ))}
            </View>
            <View style={s.section}>
              <Text style={s.heading}>Recent activity</Text>
              {data.news.slice(0, 3).map((x, i) => (
                <View style={s.item} key={i}>
                  <Text style={s.strong}>{x.title}</Text>
                  <SourceLink source={x.source} />
                </View>
              ))}
            </View>
          </View>
        </View>
        <Text style={s.footer}>
          Generated {new Date(data.generatedAt).toLocaleString()} · Public-source research; verify
          before use.
        </Text>
      </Page>
    </Document>
  );
}
export function BriefPdf({ data }: { data: BriefData }) {
  return (
    <PDFDownloadLink
      document={<BriefDocument data={data} />}
      fileName={`${data.department.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-brief.pdf`}
      className="pdf-button"
    >
      {({ loading }) => (loading ? "Preparing…" : "Download PDF ↓")}
    </PDFDownloadLink>
  );
}
