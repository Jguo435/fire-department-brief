"use client";
import dynamic from "next/dynamic";
import { BriefData, Source } from "@/types/brief";
const BriefPdf = dynamic(() => import("./BriefPdf").then((m) => m.BriefPdf), { ssr: false });
const Cite = ({ source }: { source: Source }) => (
  <a
    className="cite"
    href={source.url}
    target="_blank"
    rel="noreferrer"
    title={`Source: ${source.label}`}
  >
    ↗ {source.label}
  </a>
);
const Empty = ({ children }: { children: string }) => <p className="empty">{children}</p>;
export function BriefDisplay({ data, warnings }: { data: BriefData; warnings: string[] }) {
  const d = data.department;
  const generated = new Date(data.generatedAt);
  return (
    <article className="brief">
      <div className="brief-actions">
        <span>
          {generated.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          · {generated.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </span>
        <BriefPdf data={data} />
      </div>
      <header className="department-head">
        <div>
          <p className="eyebrow">PRE-CALL BRIEF</p>
          <h2>{d.name}</h2>
          <p>{d.address}</p>
        </div>
        <div className="contact">
          {d.phone && <a href={`tel:${d.phone}`}>{d.phone}</a>}
          {d.website && (
            <a href={d.website} target="_blank" rel="noreferrer">
              Department site ↗
            </a>
          )}
          <Cite source={d.source} />
        </div>
      </header>
      <section className="signals">
        <div className="section-label">
          <span>01</span>
          <h3>Why call now</h3>
        </div>
        <div className="signal-grid">
          {data.callSignals.length ? (
            data.callSignals.map((signal, i) => (
              <div className={`signal ${signal.kind}`} key={i}>
                <span className="signal-type">{signal.kind}</span>
                <h4>{signal.headline}</h4>
                <p>{signal.detail}</p>
                <Cite source={signal.source} />
              </div>
            ))
          ) : (
            <Empty>No public trigger was verified. Lead with current fleet priorities.</Empty>
          )}
        </div>
      </section>
      <div className="two-col">
        <section>
          <div className="section-label">
            <span>02</span>
            <h3>People</h3>
          </div>
          {data.leadership.length ? (
            <ul className="fact-list">
              {data.leadership.map((x, i) => (
                <li key={i}>
                  <div>
                    <strong>{x.name}</strong>
                    <small>{x.title}</small>
                  </div>
                  <Cite source={x.source} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No leadership names were verified.</Empty>
          )}
        </section>
        <section>
          <div className="section-label">
            <span>03</span>
            <h3>Fleet signals</h3>
          </div>
          {data.fleet.length ? (
            <ul className="fact-list">
              {data.fleet.map((x, i) => (
                <li key={i}>
                  <div>
                    <strong>{x.description}</strong>
                    {x.year && (
                      <small>
                        Model year {x.year} · {new Date().getFullYear() - x.year} years old
                        {x.acquiredYear ? ` · Acquired ${x.acquiredYear}` : ""}
                      </small>
                    )}
                  </div>
                  <Cite source={x.source} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No apparatus details were verified.</Empty>
          )}
        </section>
        <section>
          <div className="section-label">
            <span>04</span>
            <h3>Funding</h3>
          </div>
          {data.grants.length ? (
            <ul className="fact-list">
              {data.grants.map((x, i) => (
                <li key={i}>
                  <div>
                    <strong>{x.amount}</strong>
                    <small>
                      {x.program} · FY{x.fiscalYear}
                    </small>
                  </div>
                  <Cite source={x.source} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No matching FEMA awards were found.</Empty>
          )}
        </section>
        <section>
          <div className="section-label">
            <span>05</span>
            <h3>Recent activity</h3>
          </div>
          {data.news.length ? (
            <ul className="news-list">
              {data.news.slice(0, 4).map((x, i) => (
                <li key={i}>
                  <a href={x.link} target="_blank" rel="noreferrer">
                    {x.title}
                  </a>
                  <p>{x.snippet}</p>
                  <Cite source={x.source} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No recent public activity was found.</Empty>
          )}
        </section>
      </div>
      {warnings.length > 0 && (
        <div className="coverage">
          <strong>Research coverage</strong>
          <span>{warnings.join(" · ")}</span>
        </div>
      )}
    </article>
  );
}
