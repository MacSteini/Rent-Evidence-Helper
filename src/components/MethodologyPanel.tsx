import { methodologyCopy } from "../content/uiCopy";

export function MethodologyPanel() {
  return (
    <section className="info-band" id="methodology" aria-labelledby="methodology-title">
      <div className="section-heading">
        <p className="label">Methodology</p>
        <h2 id="methodology-title">How this works</h2>
      </div>
      <div className="method-list">
        {methodologyCopy.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </section>
  );
}
